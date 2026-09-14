import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import AppTextField from '../UI/AppTextField';
import { CloseIcon } from '../UI/icons';

const COMMIT_MS = 400;

type ScrollSnapshot = {
  node: HTMLElement | Window;
  top: number;
  left: number;
};

const isVerticallyScrollable = (el: HTMLElement) => {
  const overflowY = window.getComputedStyle(el).overflowY;
  return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
};

const captureScrollAncestors = (from: HTMLElement | null): ScrollSnapshot[] => {
  const snapshots: ScrollSnapshot[] = [];
  let el = from?.parentElement ?? null;
  while (el) {
    if (el.scrollHeight > el.clientHeight && isVerticallyScrollable(el)) {
      snapshots.push({ node: el, top: el.scrollTop, left: el.scrollLeft });
    }
    el = el.parentElement;
  }
  snapshots.push({ node: window, top: window.scrollY, left: window.scrollX });
  return snapshots;
};

const restoreScrollAncestors = (snapshots: ScrollSnapshot[]) => {
  snapshots.forEach((snapshot) => {
    if (snapshot.node === window) {
      window.scrollTo(snapshot.left, snapshot.top);
      return;
    }
    const node = snapshot.node;
    node.scrollTop = snapshot.top;
    node.scrollLeft = snapshot.left;
  });
};

interface KaifLifeTextBlockFieldProps {
  id: string;
  text: string;
  minRows: number;
  canDeleteWhenEmpty: boolean;
  onLiveChange: (id: string, text: string) => void;
  onCommit: (id: string, text: string) => void;
  onFocusMeta: (id: string, cursor: number) => void;
  onDelete: (id: string) => void;
  inputRef?: (node: HTMLTextAreaElement | null) => void;
}

const KaifLifeTextBlockField: React.FC<KaifLifeTextBlockFieldProps> = ({
  id,
  text,
  minRows,
  canDeleteWhenEmpty,
  onLiveChange,
  onCommit,
  onFocusMeta,
  onDelete,
  inputRef,
}) => {
  const valueRef = useRef(text);
  const committedRef = useRef(text);
  const lastEmittedRef = useRef(text);
  const commitTimerRef = useRef<number | null>(null);
  const nodeRef = useRef<HTMLTextAreaElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const minRowsRef = useRef(minRows);
  const onCommitRef = useRef(onCommit);
  const onLiveChangeRef = useRef(onLiveChange);
  const [showDelete, setShowDelete] = useState(canDeleteWhenEmpty && !text.trim());

  onCommitRef.current = onCommit;
  onLiveChangeRef.current = onLiveChange;

  const fitHeight = (node: HTMLTextAreaElement | null) => {
    if (!node) {
      return;
    }
    const snapshots = captureScrollAncestors(node);
    node.style.overflowY = 'hidden';
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
    restoreScrollAncestors(snapshots);
  };

  useEffect(() => {
    if (text === lastEmittedRef.current) {
      committedRef.current = text;
      return;
    }

    lastEmittedRef.current = text;
    valueRef.current = text;
    committedRef.current = text;
    if (nodeRef.current && nodeRef.current.value !== text) {
      nodeRef.current.value = text;
    }
    setShowDelete(canDeleteWhenEmpty && !text.trim());
  }, [text, canDeleteWhenEmpty]);

  useLayoutEffect(() => {
    const minRowsChanged = minRowsRef.current !== minRows;
    minRowsRef.current = minRows;
    if (text === lastEmittedRef.current && !minRowsChanged) {
      return;
    }
    fitHeight(nodeRef.current);
  }, [text, minRows]);

  const flushCommit = () => {
    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    if (valueRef.current !== committedRef.current) {
      lastEmittedRef.current = valueRef.current;
      committedRef.current = valueRef.current;
      onCommitRef.current(id, valueRef.current);
    }
  };

  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === 'undefined') {
      return;
    }
    let lastWidth = box.clientWidth;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? box.clientWidth;
      if (width === lastWidth) {
        return;
      }
      lastWidth = width;
      fitHeight(nodeRef.current);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [id]);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
      }
      if (valueRef.current !== committedRef.current) {
        lastEmittedRef.current = valueRef.current;
        committedRef.current = valueRef.current;
        onCommitRef.current(id, valueRef.current);
      }
    };
  }, [id]);

  const handleChange = (next: string) => {
    valueRef.current = next;
    onLiveChangeRef.current(id, next);
    fitHeight(nodeRef.current);

    setShowDelete((prev) => {
      const nextShow = canDeleteWhenEmpty && !next.trim();
      return prev === nextShow ? prev : nextShow;
    });

    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current);
    }
    commitTimerRef.current = window.setTimeout(() => {
      commitTimerRef.current = null;
      if (valueRef.current !== committedRef.current) {
        lastEmittedRef.current = valueRef.current;
        committedRef.current = valueRef.current;
        onCommitRef.current(id, valueRef.current);
      }
    }, COMMIT_MS);
  };

  const reportFocus = (event: React.SyntheticEvent<HTMLTextAreaElement | HTMLInputElement | HTMLDivElement>) => {
    const target = event.target as HTMLTextAreaElement;
    onFocusMeta(id, target.selectionStart ?? target.value.length);
  };

  return (
    <Box ref={boxRef} sx={{ position: 'relative' }} onBlur={flushCommit}>
      <AppTextField
        defaultValue={text}
        inputRef={(node) => {
          nodeRef.current = node;
          inputRef?.(node);
          fitHeight(node);
        }}
        onChange={(event) => handleChange(event.target.value)}
        onKeyUp={reportFocus}
        onClick={reportFocus}
        onFocus={reportFocus}
        multiline
        rows={minRows}
        fullWidth
        placeholder="Текст этапа"
        label="Текст этапа"
        sx={{
          '& .MuiInputBase-root': {
            alignItems: 'flex-start',
            height: 'auto',
            pr: showDelete ? 4.5 : undefined,
          },
          '& .MuiInputBase-inputMultiline': {
            overflow: 'hidden',
            resize: 'none',
            boxSizing: 'border-box',
          },
        }}
      />
      {showDelete && (
        <IconButton
          size="small"
          aria-label="Удалить пустое поле"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            flushCommit();
            onDelete(id);
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            color: 'text.secondary',
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}
    </Box>
  );
};

export default React.memo(KaifLifeTextBlockField);
