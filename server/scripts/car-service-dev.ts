import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import carServiceRoutes from '../src/routes/carService';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const app = express();
app.use(cors({ origin: ['http://localhost:4175', 'http://127.0.0.1:4175', 'https://ladya2003.github.io'] }));
app.use(express.json({ limit: '24kb' }));
app.use('/api/car-service', carServiceRoutes);
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('Configure MONGODB_URI in server/.env.');
mongoose.connect(uri).then(() => {
  app.listen(Number(process.env.CAR_SERVICE_DEV_PORT || 5086), '127.0.0.1', () => console.log('Car service API: http://127.0.0.1:' + (process.env.CAR_SERVICE_DEV_PORT || 5086) + '/api/car-service'));
}).catch(() => { console.error('Car service: cannot connect to existing MongoDB.'); process.exitCode = 1; });
