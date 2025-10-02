// Главный компонент управления контентом

import React from 'react';
import {
  Dialog,
  DialogTitle,
  Drawer,
  AppBar,
  Toolbar,
  Button,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ContentManagementDialogProps } from './types';
import { useContentManagement } from './hooks/useContentManagement';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import UploadTab from './components/UploadTab';
import ManageTab from './components/ManageTab';
import ConfirmDeleteDialog from '../../UI/ConfirmDeleteDialog';
import FrequencyChangeDialog from '../../UI/FrequencyChangeDialog';

const ContentManagementDialog: React.FC<ContentManagementDialogProps> = ({
  open,
  onClose,
  onSave,
  hasPartner,
  existingContent = [],
  onDeleteContent,
  onContentReordered
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Основная логика управления
  const {
    activeTab,
    viewMode,
    searchQuery,
    sizeFilter,
    dateFilter,
    files,
    previews,
    contentCount,
    hoursInterval,
    showFrequencyChange,
    hasFrequencyChanges,
    canSave,
    confirmDeleteOpen,
    contentToDelete,
    isDeleting,
    frequencyChangeOpen,
    pendingFrequency,
    isSaving,
    initialContentCount,
    initialHoursInterval,
    setSearchQuery,
    setSizeFilter,
    setDateFilter,
    setContentCount,
    setHoursInterval,
    setShowFrequencyChange,
    handleFileChange,
    handleRemoveFile,
    handleViewModeChange,
    handleTabChange,
    handleDeleteContent,
    handleConfirmDelete,
    handleCancelDelete,
    handleSave,
    handleFrequencyChangeConfirm,
    handleFrequencyChangeCancel,
    handleClose
  } = useContentManagement({
    open,
    existingContent,
    onSave,
    onDeleteContent,
    onClose
  });

  // Логика drag & drop
  const {
    draggedItem,
    dragOverItem,
    isDragging,
    dragStartPos,
    dragOffset,
    handlePointerDown,
    resetDragState
  } = useDragAndDrop(onContentReordered);

  // Общий контент для табов
  const tabsContent = (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 2, sm: 3 } }}
    >
      <Tab label="Загрузить новое" />
      <Tab
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Мой контент
            <Chip label={existingContent.length} size="small" />
          </Box>
        }
      />
    </Tabs>
  );

  // Общий контент страницы
  const pageContent = (
    <>
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        px: { xs: 2, sm: 3 },
        py: 2
      }}>
        {activeTab === 0 ? (
          <UploadTab
            files={files}
            previews={previews}
            contentCount={contentCount}
            hoursInterval={hoursInterval}
            hasFrequencyChanges={hasFrequencyChanges}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
            onContentCountChange={setContentCount}
            onHoursIntervalChange={setHoursInterval}
            onShowFrequencyChange={setShowFrequencyChange}
          />
        ) : (
          <ManageTab
            content={existingContent}
            viewMode={viewMode}
            searchQuery={searchQuery}
            sizeFilter={sizeFilter}
            dateFilter={dateFilter}
            draggedItem={draggedItem}
            dragOverItem={dragOverItem}
            isDragging={isDragging}
            onViewModeChange={handleViewModeChange}
            onSearchChange={setSearchQuery}
            onSizeFilterChange={setSizeFilter}
            onDateFilterChange={setDateFilter}
            onPointerDown={handlePointerDown}
            onDelete={handleDeleteContent}
          />
        )}
      </Box>

      {/* Кнопки действий */}
      <Box sx={{
        borderTop: 1,
        borderColor: 'divider',
        px: { xs: 2, sm: 3 },
        py: 2,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1
      }}>
        <Button onClick={handleClose}>
          {activeTab === 0 ? 'Отмена' : 'Закрыть'}
        </Button>
        {activeTab === 0 && (
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={!canSave}
          >
            Сохранить
          </Button>
        )}
      </Box>

      {/* Плавающий элемент при перетаскивании */}
      {isDragging && draggedItem && dragStartPos && (
        <Box
          sx={{
            position: 'fixed',
            top: dragStartPos.y + dragOffset.y - 20,
            left: dragStartPos.x + dragOffset.x + 20,
            width: '180px',
            height: '60px',
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.9,
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 4,
            animation: 'pulse 1s infinite'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            🔄 Перетаскивание...
          </Typography>
        </Box>
      )}
    </>
  );

  return (
    <>
      {/* Мобильная версия - Drawer */}
      {isMobile ? (
        <Drawer
          anchor="right"
          open={open}
          onClose={handleClose}
          transitionDuration={{ enter: 300, exit: 250 }}
          PaperProps={{
            sx: {
              width: '100%',
              maxWidth: '100vw',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default'
            }
          }}
        >
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
                Управление контентом
              </Typography>
            </Toolbar>
          </AppBar>

          {tabsContent}
          {pageContent}
        </Drawer>
      ) : (
        /* Десктопная версия - Dialog */
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
          <DialogTitle>
            Управление контентом
          </DialogTitle>

          {tabsContent}
          {pageContent}
        </Dialog>
      )}

      {/* Диалог подтверждения удаления */}
      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Удалить контент"
        itemName={contentToDelete?.name}
        message={
          contentToDelete
            ? `Вы уверены, что хотите удалить "${contentToDelete.name}"? Контент будет удален для вас и вашего партнера.`
            : undefined
        }
        isLoading={isDeleting}
      />

      {/* Диалог выбора при изменении частоты */}
      <FrequencyChangeDialog
        open={frequencyChangeOpen}
        onClose={handleFrequencyChangeCancel}
        onConfirm={handleFrequencyChangeConfirm}
        oldFrequency={{ count: initialContentCount, hours: initialHoursInterval }}
        newFrequency={pendingFrequency || { count: contentCount, hours: hoursInterval }}
        isLoading={isSaving}
      />
    </>
  );
};

export default ContentManagementDialog;

