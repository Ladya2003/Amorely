import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import MediaViewerDialog from '../common/MediaViewerDialog';
import KaifLifeBlockMoveControls from './KaifLifeBlockMoveControls';
import KaifLifeFileBlockView from './KaifLifeFileBlock';
import KaifLifeMediaBlockView from './KaifLifeMediaBlock';
import KaifLifeTextBlockField from './KaifLifeTextBlockField';
import { groupDocumentBlocks, moveContentBlock } from './kaifLifeBlocks';
import type { KaifLifeContentBlock, KaifLifeMediaBlock, KaifLifeMoveDirection } from './kaifLifeTypes';

export type KaifLifeDocumentEditorHandle = {
  flush: () => KaifLifeContentBlock[];
};

interface KaifLifeDocumentEditorProps {
  blocks: KaifLifeContentBlock[];
  focusTextId: string | null;
  onBlocksChange: (blocks: KaifLifeContentBlock[]) => void;
  onFocusChange: (textId: string | null, cursor: number) => void;
}

const KaifLifeDocumentEditor = forwardRef<KaifLifeDocumentEditorHandle, KaifLifeDocumentEditorProps>(
  ({ blocks, focusTextId, onBlocksChange, onFocusChange }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [rowWidth, setRowWidth] = useState(0);
    const [viewer, setViewer] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });
    const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
    const liveTextRef = useRef<Record<string, string>>({});
    const blocksRef = useRef(blocks);

    blocksRef.current = blocks;

    const mediaItems = useMemo(
      () => blocks.filter((block): block is KaifLifeMediaBlock => block.type === 'media'),
      [blocks]
    );

    const groups = useMemo(() => groupDocumentBlocks(blocks), [blocks]);
    const onlyOneText = blocks.length === 1 && blocks[0]?.type === 'text';

    const mergeLiveText = (source: KaifLifeContentBlock[]): KaifLifeContentBlock[] =>
      source.map((block) => {
        if (block.type !== 'text') {
          return block;
        }
        const live = liveTextRef.current[block.id];
        return live === undefined ? block : { ...block, text: live };
      });

    useImperativeHandle(ref, () => ({
      flush: () => {
        const next = mergeLiveText(blocksRef.current);
        liveTextRef.current = {};
        if (JSON.stringify(next) !== JSON.stringify(blocksRef.current)) {
          onBlocksChange(next);
        }
        return next;
      },
    }));

    useEffect(() => {
      const node = containerRef.current;
      if (!node) {
        return;
      }

      const update = () => setRowWidth(node.clientWidth);
      update();

      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const observer = new ResizeObserver(update);
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      if (!focusTextId) {
        return;
      }
      const node = textareaRefs.current[focusTextId];
      if (node) {
        node.focus();
      }
    }, [focusTextId]);

    const commitText = (id: string, text: string) => {
      liveTextRef.current[id] = text;
      onBlocksChange(mergeLiveText(blocksRef.current));
    };

    const updateMediaWidth = (id: string, widthPercent: number) => {
      onBlocksChange(
        mergeLiveText(blocksRef.current).map((block) =>
          block.type === 'media' && block.id === id ? { ...block, widthPercent } : block
        )
      );
    };

    const deleteBlock = (id: string) => {
      onBlocksChange(mergeLiveText(blocksRef.current).filter((block) => block.id !== id));
    };

    const deleteText = (id: string) => {
      const next = mergeLiveText(blocksRef.current).filter((block) => block.id !== id);
      if (next.length === 0) {
        return;
      }
      delete liveTextRef.current[id];
      if (focusTextId === id) {
        onFocusChange(null, 0);
      }
      onBlocksChange(next);
    };

    const moveBlock = (id: string, direction: KaifLifeMoveDirection) => {
      onBlocksChange(moveContentBlock(mergeLiveText(blocksRef.current), id, direction));
    };

    const renderMoveControls = (id: string) => {
      const index = blocks.findIndex((block) => block.id === id);
      return (
        <KaifLifeBlockMoveControls
          canMoveUp={index > 0}
          canMoveDown={index >= 0 && index < blocks.length - 1}
          onMove={(direction) => moveBlock(id, direction)}
        />
      );
    };

    return (
      <Box ref={containerRef} sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {groups.map((group) => {
          if (group.type === 'text') {
            return (
              <Box
                key={group.block.id}
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, width: '100%' }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <KaifLifeTextBlockField
                    id={group.block.id}
                    text={group.block.text}
                    minRows={onlyOneText ? 8 : 3}
                    canDeleteWhenEmpty={blocks.length > 1}
                    onLiveChange={(id, text) => {
                      liveTextRef.current[id] = text;
                    }}
                    onCommit={commitText}
                    onFocusMeta={onFocusChange}
                    onDelete={deleteText}
                    inputRef={(node) => {
                      textareaRefs.current[group.block.id] = node;
                    }}
                  />
                </Box>
                {renderMoveControls(group.block.id)}
              </Box>
            );
          }

          if (group.type === 'document') {
            return (
              <Box
                key={group.block.id}
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, width: '100%' }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <KaifLifeFileBlockView
                    block={group.block}
                    onDelete={() => deleteBlock(group.block.id)}
                  />
                </Box>
                {renderMoveControls(group.block.id)}
              </Box>
            );
          }

          if (group.type === 'mediaRow') {
            return (
              <Box
                key={group.blocks.map((block) => block.id).join('-')}
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  gap: 1,
                  width: '100%',
                }}
              >
                {group.blocks.map((block) => (
                  <Box
                    key={block.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 0.25,
                      width: `${block.widthPercent}%`,
                      maxWidth: '100%',
                      flex: '0 0 auto',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <KaifLifeMediaBlockView
                        block={block}
                        rowWidth={rowWidth}
                        onChangeWidth={(widthPercent) => updateMediaWidth(block.id, widthPercent)}
                        onDelete={() => deleteBlock(block.id)}
                        onOpen={() => {
                          const index = mediaItems.findIndex((item) => item.id === block.id);
                          setViewer({ open: true, index: Math.max(0, index) });
                        }}
                      />
                    </Box>
                    {renderMoveControls(block.id)}
                  </Box>
                ))}
              </Box>
            );
          }

          const _exhaustive: never = group;
          return _exhaustive;
        })}

        <MediaViewerDialog
          open={viewer.open}
          onClose={() => setViewer((prev) => ({ ...prev, open: false }))}
          content={null}
          gallery={mediaItems.map((item) => ({
            url: item.url,
            resourceType: item.mediaType,
          }))}
          initialIndex={viewer.index}
        />
      </Box>
    );
  }
);

KaifLifeDocumentEditor.displayName = 'KaifLifeDocumentEditor';

export default KaifLifeDocumentEditor;
