// Вспомогательные функции для управления контентом

import { ContentItem, SizeFilter, DateFilter } from '../types';

/**
 * Форматирует размер файла в читаемый вид
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
};

/**
 * Форматирует дату в читаемый вид
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Фильтрует контент по различным критериям
 */
export const filterContent = (
  content: ContentItem[],
  searchQuery: string,
  sizeFilter: SizeFilter,
  dateFilter: DateFilter
): ContentItem[] => {
  let filtered = content;

  // Поиск по названию
  if (searchQuery.trim()) {
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Фильтр по размеру
  if (sizeFilter !== 'all') {
    filtered = filtered.filter(item => {
      const sizeMB = item.size / (1024 * 1024);
      switch (sizeFilter) {
        case 'small':
          return sizeMB < 5;
        case 'medium':
          return sizeMB >= 5 && sizeMB < 20;
        case 'large':
          return sizeMB >= 20;
        default:
          return true;
      }
    });
  }

  // Фильтр по дате
  if (dateFilter !== 'all') {
    const now = new Date();
    filtered = filtered.filter(item => {
      const uploadDate = new Date(item.uploadedAt);
      const daysDiff = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);
      
      switch (dateFilter) {
        case 'today':
          return daysDiff < 1;
        case 'week':
          return daysDiff < 7;
        case 'month':
          return daysDiff < 30;
        case 'older':
          return daysDiff >= 30;
        default:
          return true;
      }
    });
  }

  return filtered;
};

/**
 * Получает координаты события (мышь или тач)
 */
export const getEventPos = (
  e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent
): { x: number; y: number } => {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
};

