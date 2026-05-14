import express, { Response } from 'express';
import mongoose from 'mongoose';
import CryptoDevice from '../models/cryptoDevice';
import EncryptedKeyBackup from '../models/encryptedKeyBackup';
import PairingSession from '../models/pairingSession';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.put('/backup', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { deviceId, ciphertext, iv, salt, kdf, version } = req.body || {};

    if (!userId || !deviceId || !ciphertext || !iv || !salt) {
      return res.status(400).json({ error: 'Недостаточно данных для сохранения backup' });
    }

    const backup = await EncryptedKeyBackup.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), deviceId },
      {
        userId: new mongoose.Types.ObjectId(userId),
        deviceId,
        ciphertext,
        iv,
        salt,
        kdf: {
          name: String(kdf?.name || 'PBKDF2'),
          iterations: Number(kdf?.iterations || 250000),
          hash: String(kdf?.hash || 'SHA-256')
        },
        version: Number(version || 1)
      },
      { upsert: true, new: true }
    );

    return res.json({ id: backup._id.toString(), updatedAt: backup.updatedAt });
  } catch (error) {
    console.error('Ошибка при сохранении crypto backup:', error);
    return res.status(500).json({ error: 'Ошибка при сохранении crypto backup' });
  }
});

router.get('/backup', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const deviceId = String(req.query.deviceId || '');
    const filter: Record<string, any> = { userId: new mongoose.Types.ObjectId(userId) };
    if (deviceId) {
      filter.deviceId = deviceId;
    }

    const backup = await EncryptedKeyBackup.findOne(filter).sort({ updatedAt: -1 });
    if (!backup) {
      return res.status(404).json({ error: 'Backup не найден' });
    }

    return res.json({
      deviceId: backup.deviceId,
      ciphertext: backup.ciphertext,
      iv: backup.iv,
      salt: backup.salt,
      kdf: backup.kdf,
      version: backup.version,
      updatedAt: backup.updatedAt
    });
  } catch (error) {
    console.error('Ошибка при загрузке crypto backup:', error);
    return res.status(500).json({ error: 'Ошибка при загрузке crypto backup' });
  }
});

router.post('/devices', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const {
      deviceId,
      identityPublicKey,
      signedPreKey,
      oneTimePreKeys
    } = req.body || {};

    if (!userId || !deviceId || !identityPublicKey || !signedPreKey?.publicKey || !signedPreKey?.signature) {
      return res.status(400).json({ error: 'Недостаточно данных устройства' });
    }

    const saved = await CryptoDevice.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), deviceId },
      {
        userId: new mongoose.Types.ObjectId(userId),
        deviceId,
        identityPublicKey,
        signedPreKey: {
          keyId: String(signedPreKey.keyId || 'spk-1'),
          publicKey: String(signedPreKey.publicKey),
          signature: String(signedPreKey.signature)
        },
        oneTimePreKeys: Array.isArray(oneTimePreKeys)
          ? oneTimePreKeys.map((key: any) => ({
              keyId: String(key.keyId),
              publicKey: String(key.publicKey)
            }))
          : [],
        lastSeen: new Date()
      },
      { upsert: true, new: true }
    );

    return res.json({
      userId,
      deviceId: saved.deviceId,
      identityPublicKey: saved.identityPublicKey,
      signedPreKey: saved.signedPreKey,
      oneTimePreKeyCount: saved.oneTimePreKeys.length
    });
  } catch (error) {
    console.error('Ошибка при сохранении crypto устройства:', error);
    return res.status(500).json({ error: 'Ошибка при сохранении crypto устройства' });
  }
});

router.get('/devices/me', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const devices = await CryptoDevice.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .select('deviceId identityPublicKey signedPreKey oneTimePreKeys updatedAt');

    return res.json(
      devices.map((device) => ({
        deviceId: device.deviceId,
        identityPublicKey: device.identityPublicKey,
        signedPreKey: device.signedPreKey,
        oneTimePreKeys: device.oneTimePreKeys,
        updatedAt: device.updatedAt
      }))
    );
  } catch (error) {
    console.error('Ошибка при получении устройств:', error);
    return res.status(500).json({ error: 'Ошибка при получении устройств' });
  }
});

router.get('/prekey-bundle/:userId', async (req: any, res: Response) => {
  try {
    const targetUserId = req.params.userId as string;
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: 'Некорректный userId' });
    }

    const deviceId = String(req.query.deviceId || '');
    const filter: Record<string, any> = { userId: new mongoose.Types.ObjectId(targetUserId) };
    if (deviceId) {
      filter.deviceId = deviceId;
    }

    const device = await CryptoDevice.findOne(filter).sort({ updatedAt: -1 });
    if (!device) {
      return res.status(404).json({ error: 'Криптографическое устройство не найдено' });
    }

    return res.json({
      userId: targetUserId,
      deviceId: device.deviceId,
      identityPublicKey: device.identityPublicKey,
      signedPreKey: device.signedPreKey,
      oneTimePreKey: device.oneTimePreKeys[0] || null
    });
  } catch (error) {
    console.error('Ошибка при выдаче prekey bundle:', error);
    return res.status(500).json({ error: 'Ошибка при выдаче prekey bundle' });
  }
});

router.post('/pairing/start', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { requesterDeviceId, requesterEphemeralPublicKey } = req.body || {};

    if (!requesterDeviceId || !requesterEphemeralPublicKey) {
      return res.status(400).json({ error: 'Недостаточно данных для pairing' });
    }

    const pairingId = `pair-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const shortCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PairingSession.create({
      pairingId,
      requesterUserId: new mongoose.Types.ObjectId(userId),
      requesterDeviceId: String(requesterDeviceId),
      requesterEphemeralPublicKey: String(requesterEphemeralPublicKey),
      shortCode,
      status: 'pending',
      expiresAt
    });

    return res.status(201).json({ pairingId, shortCode, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error('Ошибка при создании pairing сессии:', error);
    return res.status(500).json({ error: 'Ошибка при создании pairing сессии' });
  }
});

router.get('/pairing/:pairingId', async (req: any, res: Response) => {
  try {
    const requesterUserId = req.userId as string;
    const pairingId = req.params.pairingId;
    const session = await PairingSession.findOne({
      pairingId,
      requesterUserId: new mongoose.Types.ObjectId(requesterUserId)
    });

    if (!session) {
      return res.status(404).json({ error: 'Pairing сессия не найдена' });
    }

    if (session.expiresAt.getTime() < Date.now() && session.status !== 'consumed') {
      session.status = 'expired';
      await session.save();
    }

    return res.json({
      pairingId: session.pairingId,
      requesterEphemeralPublicKey: session.requesterEphemeralPublicKey,
      shortCode: session.shortCode,
      status: session.status,
      encryptedPayload: session.encryptedPayload || null,
      expiresAt: session.expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Ошибка при чтении pairing сессии:', error);
    return res.status(500).json({ error: 'Ошибка при чтении pairing сессии' });
  }
});

router.post('/pairing/:pairingId/approve', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const pairingId = req.params.pairingId;
    const { shortCode, encryptedPayload } = req.body || {};

    if (!shortCode || !encryptedPayload) {
      return res.status(400).json({ error: 'Недостаточно данных для подтверждения pairing' });
    }

    const session = await PairingSession.findOne({ pairingId, shortCode });
    if (!session) {
      return res.status(404).json({ error: 'Pairing сессия не найдена' });
    }

    if (session.expiresAt.getTime() < Date.now()) {
      session.status = 'expired';
      await session.save();
      return res.status(410).json({ error: 'Pairing сессия истекла' });
    }

    if (session.requesterUserId.toString() !== userId) {
      return res.status(403).json({ error: 'Можно подтверждать только для своего аккаунта' });
    }

    session.encryptedPayload = String(encryptedPayload);
    session.status = 'approved';
    await session.save();

    return res.json({ status: session.status });
  } catch (error) {
    console.error('Ошибка при подтверждении pairing:', error);
    return res.status(500).json({ error: 'Ошибка при подтверждении pairing' });
  }
});

router.post('/pairing/:pairingId/consume', async (req: any, res: Response) => {
  try {
    const requesterUserId = req.userId as string;
    const pairingId = req.params.pairingId;
    const session = await PairingSession.findOne({
      pairingId,
      requesterUserId: new mongoose.Types.ObjectId(requesterUserId)
    });

    if (!session) {
      return res.status(404).json({ error: 'Pairing сессия не найдена' });
    }

    if (!session.encryptedPayload || session.status !== 'approved') {
      return res.status(409).json({ error: 'Pairing еще не подтвержден' });
    }

    session.status = 'consumed';
    await session.save();

    return res.json({ encryptedPayload: session.encryptedPayload });
  } catch (error) {
    console.error('Ошибка при завершении pairing:', error);
    return res.status(500).json({ error: 'Ошибка при завершении pairing' });
  }
});

export default router;
