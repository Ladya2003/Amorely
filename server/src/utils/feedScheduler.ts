import cron from 'node-cron';
import { refreshDynamicFeedForAllActiveRelationships } from './dynamicFeedRotation';

const SCHEDULE = '0 2,17 * * *';
const TIMEZONE = 'Europe/Minsk';

export const startFeedScheduler = () => {
  cron.schedule(
    SCHEDULE,
    async () => {
      try {
        await refreshDynamicFeedForAllActiveRelationships();
      } catch (error) {
        console.error('Ошибка cron-генерации ленты:', error);
      }
    },
    { timezone: TIMEZONE }
  );
};
