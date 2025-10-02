// Вкладка управления существующим контентом

import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Alert
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ContentItem, ViewMode, SizeFilter, DateFilter } from '../types';
import { filterContent } from '../utils/helpers';
import ContentGrid from './ContentGrid';
import ContentList from './ContentList';

interface ManageTabProps {
  content: ContentItem[];
  viewMode: ViewMode;
  searchQuery: string;
  sizeFilter: SizeFilter;
  dateFilter: DateFilter;
  draggedItem: string | null;
  dragOverItem: string | null;
  isDragging: boolean;
  onViewModeChange: (event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => void;
  onSearchChange: (query: string) => void;
  onSizeFilterChange: (filter: SizeFilter) => void;
  onDateFilterChange: (filter: DateFilter) => void;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent, itemId: string) => void;
  onDelete: (contentId: string) => void;
}

const ManageTab: React.FC<ManageTabProps> = ({
  content,
  viewMode,
  searchQuery,
  sizeFilter,
  dateFilter,
  draggedItem,
  dragOverItem,
  isDragging,
  onViewModeChange,
  onSearchChange,
  onSizeFilterChange,
  onDateFilterChange,
  onPointerDown,
  onDelete
}) => {
  const filteredContent = filterContent(content, searchQuery, sizeFilter, dateFilter);

  return (
    <>
      {/* Поиск и фильтры */}
      <Box sx={{ mb: 3, mt: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Поиск по названию..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Размер</InputLabel>
            <Select
              value={sizeFilter}
              onChange={(e) => onSizeFilterChange(e.target.value as SizeFilter)}
              label="Размер"
            >
              <MenuItem value="all">Все размеры</MenuItem>
              <MenuItem value="small">Маленькие (&lt; 5 МБ)</MenuItem>
              <MenuItem value="medium">Средние (5-20 МБ)</MenuItem>
              <MenuItem value="large">Большие (&gt; 20 МБ)</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Дата</InputLabel>
            <Select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value as DateFilter)}
              label="Дата"
            >
              <MenuItem value="all">Все даты</MenuItem>
              <MenuItem value="today">Сегодня</MenuItem>
              <MenuItem value="week">За неделю</MenuItem>
              <MenuItem value="month">За месяц</MenuItem>
              <MenuItem value="older">Старше месяца</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Заголовок и переключатель вида */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Всего файлов: {filteredContent.length} {content.length !== filteredContent.length && `из ${content.length}`}
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={onViewModeChange}
          size="small"
        >
          <ToggleButton value="grid">
            <GridViewIcon />
          </ToggleButton>
          <ToggleButton value="list">
            <ViewListIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Подсказка по drag & drop */}
      {filteredContent.length > 1 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          💡 Используйте иконку ⋮⋮ для перетаскивания карточек и изменения порядка
        </Alert>
      )}

      {/* Контент */}
      {filteredContent.length === 0 ? (
        <Box sx={{
          textAlign: 'center',
          py: 8,
          color: 'text.secondary'
        }}>
          <CloudUploadIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" gutterBottom>
            {content.length === 0 ? 'Нет загруженного контента' : 'Контент не найден'}
          </Typography>
          <Typography variant="body2">
            {content.length === 0
              ? 'Перейдите на вкладку "Загрузить новое" чтобы добавить фото или видео'
              : 'Попробуйте изменить параметры поиска или фильтров'
            }
          </Typography>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <ContentGrid
              content={filteredContent}
              draggedItem={draggedItem}
              dragOverItem={dragOverItem}
              isDragging={isDragging}
              onPointerDown={onPointerDown}
              onDelete={onDelete}
            />
          ) : (
            <ContentList
              content={filteredContent}
              draggedItem={draggedItem}
              dragOverItem={dragOverItem}
              isDragging={isDragging}
              onPointerDown={onPointerDown}
              onDelete={onDelete}
            />
          )}
        </>
      )}
    </>
  );
};

export default ManageTab;

