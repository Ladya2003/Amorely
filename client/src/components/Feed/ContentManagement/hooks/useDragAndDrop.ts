// Хук для управления drag & drop функциональностью

import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../../../config';
import { getEventPos } from '../utils/helpers';

interface DragAndDropState {
  draggedItem: string | null;
  dragOverItem: string | null;
  isDragging: boolean;
  dragStartPos: { x: number; y: number } | null;
  dragStartTime: number;
  dragOffset: { x: number; y: number };
}

export const useDragAndDrop = (onContentReordered?: () => void) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  /**
   * Отправляет запрос на изменение порядка контента
   */
  const handleReorderContent = async (sourceId: string, targetId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('🔄 Отправляем запрос на изменение порядка:', { sourceId, targetId });

      const response = await axios.put(`${API_URL}/api/feed/content/reorder`, {
        sourceId,
        targetId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Порядок изменен:', response.data);
      
      if (onContentReordered) {
        onContentReordered();
      }
      
    } catch (error) {
      console.error('❌ Ошибка при изменении порядка контента:', error);
    }
  };

  /**
   * Обработчик начала перетаскивания
   */
  const handlePointerDown = (
    e: React.MouseEvent | React.TouchEvent, 
    itemId: string
  ) => {
    const startPos = getEventPos(e);
    const startTime = Date.now();
    console.log('👆 Pointer down:', { itemId, startPos, eventType: e.type });
    
    setDragStartPos(startPos);
    setDragStartTime(startTime);
    setDraggedItem(itemId);
    
    let dragActive = false;
    let currentDraggedItem = itemId;
    let currentDragOverItem: string | null = null;
    
    const handlePointerMove = (moveEvent: MouseEvent | TouchEvent) => {
      console.log('🔄 Pointer move detected:', { eventType: moveEvent.type });
      
      const currentPos = getEventPos(moveEvent);
      const deltaX = currentPos.x - startPos.x;
      const deltaY = currentPos.y - startPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const timeElapsed = Date.now() - startTime;
      
      console.log('📊 Move data:', { distance, timeElapsed, deltaX, deltaY });
      
      if (timeElapsed > 100 && distance > 3) {
        moveEvent.preventDefault();
        
        if (!dragActive) {
          dragActive = true;
          setIsDragging(true);
          document.body.style.overflow = 'hidden';
          console.log('🔥 Drag started!', { itemId, distance, timeElapsed });
        }
        
        setDragOffset({ x: deltaX, y: deltaY });
        console.log('📱 Drag move:', { deltaX, deltaY, currentPos });
        
        const elementBelow = document.elementFromPoint(currentPos.x, currentPos.y);
        const cardElement = elementBelow?.closest('[data-content-id]');
        if (cardElement) {
          const targetId = cardElement.getAttribute('data-content-id');
          if (targetId && targetId !== itemId) {
            currentDragOverItem = targetId;
            setDragOverItem(targetId);
            console.log('🎯 Drag over:', targetId);
          } else {
            currentDragOverItem = null;
            setDragOverItem(null);
          }
        } else {
          currentDragOverItem = null;
          setDragOverItem(null);
        }
      }
    };

    const handlePointerUp = () => {
      console.log('👆 Pointer up:', { 
        dragActive, 
        currentDraggedItem, 
        currentDragOverItem
      });
      
      if (dragActive && currentDraggedItem && currentDragOverItem && currentDraggedItem !== currentDragOverItem) {
        console.log(`✅ Перемещение ${currentDraggedItem} на позицию ${currentDragOverItem}`);
        handleReorderContent(currentDraggedItem, currentDragOverItem);
      }
      
      setIsDragging(false);
      setDraggedItem(null);
      setDragOverItem(null);
      setDragStartPos(null);
      setDragStartTime(0);
      setDragOffset({ x: 0, y: 0 });
      
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchend', handlePointerUp);
      
      document.body.style.overflow = '';
      console.log('🧹 Cleanup completed');
    };

    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchend', handlePointerUp);
    
    console.log('🎯 Event listeners added');
  };

  /**
   * Сброс состояния drag & drop
   */
  const resetDragState = () => {
    setDraggedItem(null);
    setDragOverItem(null);
    setIsDragging(false);
    setDragStartPos(null);
    setDragStartTime(0);
    setDragOffset({ x: 0, y: 0 });
  };

  return {
    draggedItem,
    dragOverItem,
    isDragging,
    dragStartPos,
    dragOffset,
    handlePointerDown,
    resetDragState
  };
};

