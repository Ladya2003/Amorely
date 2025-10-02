import Content from '../models/content';
import mongoose from 'mongoose';

/**
 * Инициализирует ротацию контента для пользователя
 * @param userId - ID пользователя
 * @param partnerId - ID партнера
 */
export const initializeContentRotation = async (userId: string, partnerId: string) => {
  try {
    const formattedUserId = new mongoose.Types.ObjectId(userId);
    const formattedPartnerId = new mongoose.Types.ObjectId(partnerId);
    
    // Получаем весь контент пользователя и партнера
    const allContent = await Content.find({
      $or: [
        { userId: formattedUserId },
        { userId: formattedPartnerId }
      ]
    }).sort({ sortOrder: 1, createdAt: 1 }); // Сортируем по порядку, затем по времени создания
    
    if (allContent.length === 0) return;
    
    // Получаем настройки частоты из первого элемента
    const frequency = allContent[0].frequency || { count: 3, hours: 24 };
    const { count, hours } = frequency;
    
    // Вычисляем общее количество батчей для полного цикла
    const totalBatches = Math.ceil(allContent.length / count);
    
    // Инициализируем ротацию
    for (let i = 0; i < allContent.length; i++) {
      const content = allContent[i];
      const batchNumber = Math.floor(i / count);
      const isActive = batchNumber === 0;
      const nextDisplayTime = isActive ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;
      
      await Content.findByIdAndUpdate(content._id, {
        rotationOrder: i,
        currentBatch: 0, // Начинаем с первого батча
        totalBatches,
        isActive: isActive, // Активны все элементы первого батча (0, 1, 2 для count=3)
        batchStartTime: isActive ? new Date() : null,
        nextDisplay: nextDisplayTime
      });
    }
  } catch (error) {
    console.error('Ошибка при инициализации ротации контента:', error);
    throw error;
  }
};

/**
 * Переключает на следующий батч контента
 * @param userId - ID пользователя
 * @param partnerId - ID партнера
 */
export const rotateToNextBatch = async (userId: string, partnerId: string) => {
  try {
    const formattedUserId = new mongoose.Types.ObjectId(userId);
    const formattedPartnerId = new mongoose.Types.ObjectId(partnerId);
    
    // Получаем текущий активный контент
    const activeContent = await Content.findOne({
      $or: [
        { userId: formattedUserId },
        { userId: formattedPartnerId }
      ],
      isActive: true
    });
    
    if (!activeContent) {
      // Если нет активного контента, инициализируем ротацию
      await initializeContentRotation(userId, partnerId);
      return;
    }
    
    const currentBatch = activeContent.currentBatch;
    const totalBatches = activeContent.totalBatches;
    const frequency = activeContent.frequency || { count: 3, hours: 24 };
    
    // Вычисляем следующий батч (с циклическим возвратом к началу)
    const nextBatch = (currentBatch + 1) % totalBatches;
    
    // Деактивируем текущий батч
    await Content.updateMany({
      $or: [
        { userId: formattedUserId },
        { userId: formattedPartnerId }
      ],
      currentBatch: currentBatch,
      isActive: true
    }, {
      isActive: false,
      lastDisplayed: new Date()
    });
    
    // Активируем следующий батч
    const nextBatchStartOrder = nextBatch * frequency.count;
    const nextBatchEndOrder = nextBatchStartOrder + frequency.count - 1;
    
    const nextDisplayTime = new Date();
    const nextRotationTime = new Date(nextDisplayTime.getTime() + frequency.hours * 60 * 60 * 1000);
    
    await Content.updateMany({
      $or: [
        { userId: formattedUserId },
        { userId: formattedPartnerId }
      ],
      rotationOrder: { $gte: nextBatchStartOrder, $lte: nextBatchEndOrder }
    }, {
      currentBatch: nextBatch,
      isActive: true,
      batchStartTime: nextDisplayTime,
      nextDisplay: nextRotationTime
    });
  } catch (error) {
    console.error('Ошибка при ротации контента:', error);
    throw error;
  }
};

/**
 * Получает активный контент для отображения
 * @param userId - ID пользователя
 * @param partnerId - ID партнера
 */
export const getActiveContent = async (userId: string, partnerId: string) => {
  try {
    const formattedUserId = new mongoose.Types.ObjectId(userId);
    const formattedPartnerId = new mongoose.Types.ObjectId(partnerId);
    
    // Получаем активный контент
    let activeContent = await Content.find({
      $or: [
        { userId: formattedUserId },
        { userId: formattedPartnerId }
      ],
      isActive: true
    }).sort({ rotationOrder: 1 });
    
    // Если нет активного контента, инициализируем ротацию
    if (activeContent.length === 0) {
      await initializeContentRotation(userId, partnerId);
      activeContent = await Content.find({
        $or: [
          { userId: formattedUserId },
          { userId: formattedPartnerId }
        ],
        isActive: true
      }).sort({ rotationOrder: 1 });
    } else {
      // Проверяем, что у нас есть все элементы текущего батча
      const currentBatch = activeContent[0].currentBatch;
      const frequency = activeContent[0].frequency || { count: 3, hours: 24 };
      
      // Если активных элементов меньше чем должно быть в батче, 
      // возможно что-то пошло не так при предыдущей ротации
      if (activeContent.length < frequency.count) {
        // Деактивируем все элементы
        await Content.updateMany({
          $or: [
            { userId: formattedUserId },
            { userId: formattedPartnerId }
          ]
        }, {
          isActive: false
        });
        
        // Активируем правильные элементы текущего батча
        const batchStartOrder = currentBatch * frequency.count;
        const batchEndOrder = batchStartOrder + frequency.count - 1;
        
        await Content.updateMany({
          $or: [
            { userId: formattedUserId },
            { userId: formattedPartnerId }
          ],
          rotationOrder: { $gte: batchStartOrder, $lte: batchEndOrder }
        }, {
          isActive: true,
          currentBatch: currentBatch
        });
        
        // Получаем обновленный активный контент
        activeContent = await Content.find({
          $or: [
            { userId: formattedUserId },
            { userId: formattedPartnerId }
          ],
          isActive: true
        }).sort({ rotationOrder: 1 });
      }
    }
    
    // Проверяем, не пора ли переключиться на следующий батч
    if (activeContent.length > 0) {
      const firstActive = activeContent[0];
      const now = new Date();
      
      if (firstActive.nextDisplay && now >= firstActive.nextDisplay) {
        await rotateToNextBatch(userId, partnerId);
        // Получаем обновленный активный контент
        activeContent = await Content.find({
          $or: [
            { userId: formattedUserId },
            { userId: formattedPartnerId }
          ],
          isActive: true
        }).sort({ rotationOrder: 1 });
      }
    }
    
    return activeContent;
  } catch (error) {
    console.error('Ошибка при получении активного контента:', error);
    throw error;
  }
};

/**
 * Пересчитывает rotationOrder для всего контента на основе sortOrder
 * @param userId - ID пользователя
 * @param partnerId - ID партнера
 */
export const recalculateRotationOrder = async (userId: string, partnerId: string) => {
  try {
    const formattedUserId = new mongoose.Types.ObjectId(userId);
    const formattedPartnerId = new mongoose.Types.ObjectId(partnerId);
    
    // Получаем весь контент отсортированный по sortOrder
    const allContent = await Content.find({
      $or: [
        { userId: formattedUserId },
        { userId: formattedPartnerId }
      ]
    }).sort({ sortOrder: 1, createdAt: 1 });
    
    if (allContent.length === 0) return;
    
    // Получаем текущий активный контент для определения текущего батча
    const currentActiveContent = await Content.findOne({
      $or: [
        { userId: formattedUserId },
        { userId: formattedPartnerId }
      ],
      isActive: true
    });
    
    const frequency = allContent[0].frequency || { count: 3, hours: 24 };
    const totalBatches = Math.ceil(allContent.length / frequency.count);
    
    // Если есть активный контент, сохраняем его ID чтобы понять к какому батчу он теперь относится
    const activeContentIds = currentActiveContent 
      ? await Content.find({
          $or: [
            { userId: formattedUserId },
            { userId: formattedPartnerId }
          ],
          isActive: true
        }).select('_id')
      : [];
    
    // Пересчитываем rotationOrder для всех элементов
    for (let i = 0; i < allContent.length; i++) {
      const content = allContent[i];
      const newBatchNumber = Math.floor(i / frequency.count);
      
      await Content.findByIdAndUpdate(content._id, {
        rotationOrder: i,
        totalBatches
      });
    }
    
    // Если был активный контент, нужно определить новый текущий батч
    if (activeContentIds.length > 0) {
      // Деактивируем все элементы
      await Content.updateMany({
        $or: [
          { userId: formattedUserId },
          { userId: formattedPartnerId }
        ]
      }, {
        isActive: false
      });
      
      // Находим первый элемент из ранее активных в новом порядке
      const firstActiveInNewOrder = await Content.findOne({
        _id: { $in: activeContentIds.map((item: any) => item._id) }
      }).sort({ rotationOrder: 1 });
      
      if (firstActiveInNewOrder) {
        const newBatch = Math.floor(firstActiveInNewOrder.rotationOrder / frequency.count);
        const batchStartOrder = newBatch * frequency.count;
        const batchEndOrder = batchStartOrder + frequency.count - 1;
        
        // Активируем элементы нового батча
        await Content.updateMany({
          $or: [
            { userId: formattedUserId },
            { userId: formattedPartnerId }
          ],
          rotationOrder: { $gte: batchStartOrder, $lte: batchEndOrder }
        }, {
          isActive: true,
          currentBatch: newBatch,
          batchStartTime: new Date()
        });
      } else {
        // Если не нашли активный элемент, инициализируем ротацию заново
        await initializeContentRotation(userId, partnerId);
      }
    }
  } catch (error) {
    console.error('Ошибка при пересчете порядка ротации:', error);
    throw error;
  }
};

/**
 * Обновляет настройки частоты и опционально сбрасывает ротацию
 * @param userId - ID пользователя
 * @param partnerId - ID партнера
 * @param frequency - Новые настройки частоты
 * @param resetRotation - Сбросить ли ротацию к началу
 */
export const updateFrequencyAndRotation = async (
  userId: string, 
  partnerId: string, 
  frequency: { count: number; hours: number }, 
  resetRotation: boolean = false
) => {
  try {
    const formattedUserId = new mongoose.Types.ObjectId(userId);
    const formattedPartnerId = new mongoose.Types.ObjectId(partnerId);
    
    // Обновляем частоту для всего контента
    await Content.updateMany({
      $or: [
        { userId: formattedUserId },
        { userId: formattedPartnerId }
      ]
    }, {
      frequency: frequency
    });
    
    if (resetRotation) {
      // Сбрасываем ротацию к началу
      await initializeContentRotation(userId, partnerId);
    } else {
      // Получаем текущий активный контент для определения текущего батча
      const currentActiveContent = await Content.findOne({
        $or: [
          { userId: formattedUserId },
          { userId: formattedPartnerId }
        ],
        isActive: true
      });
      
      if (currentActiveContent) {
        const currentBatch = currentActiveContent.currentBatch;
        
        // Получаем весь контент для пересчета totalBatches
        const allContent = await Content.find({
          $or: [
            { userId: formattedUserId },
            { userId: formattedPartnerId }
          ]
        }).sort({ sortOrder: 1, createdAt: 1 });
        
        const totalBatches = Math.ceil(allContent.length / frequency.count);
        
        // Обновляем totalBatches для всего контента
        await Content.updateMany({
          $or: [
            { userId: formattedUserId },
            { userId: formattedPartnerId }
          ]
        }, {
          totalBatches: totalBatches
        });
        
        // Деактивируем все элементы
        await Content.updateMany({
          $or: [
            { userId: formattedUserId },
            { userId: formattedPartnerId }
          ]
        }, {
          isActive: false
        });
        
        // Активируем правильные элементы текущего батча с новым количеством
        const batchStartOrder = currentBatch * frequency.count;
        const batchEndOrder = batchStartOrder + frequency.count - 1;
        
        // Пересчитываем время следующей ротации
        const nextRotationTime = new Date(Date.now() + frequency.hours * 60 * 60 * 1000);
        
        await Content.updateMany({
          $or: [
            { userId: formattedUserId },
            { userId: formattedPartnerId }
          ],
          rotationOrder: { $gte: batchStartOrder, $lte: batchEndOrder }
        }, {
          isActive: true,
          currentBatch: currentBatch,
          nextDisplay: nextRotationTime,
          batchStartTime: new Date()
        });
      } else {
        await initializeContentRotation(userId, partnerId);
      }
    }
  } catch (error) {
    console.error('Ошибка при обновлении частоты и ротации:', error);
    throw error;
  }
};
