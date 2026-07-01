import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Box } from '@mui/material';
import type { DrawStroke } from '../../services/gamesService';
import type { DrawingTool } from './DrawingToolsToolbar';
import { floodFillCanvas } from '../../utils/drawCanvasFill';
import { GAMES_LIST_ITEM_RADIUS } from './gamesListStyles';

export const DRAW_CANVAS_BORDER_RADIUS = GAMES_LIST_ITEM_RADIUS;

export interface DrawCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

export interface DrawCanvasProps {
  strokes: DrawStroke[];
  canDraw: boolean;
  tool?: DrawingTool;
  strokeColor?: string;
  strokeWidth?: number;
  onStroke?: (stroke: DrawStroke) => void;
  /** Фоновое изображение (например, ранее сохранённый рисунок) */
  backgroundImageUrl?: string | null;
  /** Минимальная высота холста в px (по умолчанию 280) */
  minHeight?: number;
  /** Скругление контейнера холста в px */
  borderRadius?: number;
  /** Показывать рамку вокруг холста */
  showBorder?: boolean;
}

const drawCanvasInteractionSx = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'none',
  WebkitUserDrag: 'none',
  userDrag: 'none',
} as const;

const getCanvasDpr = () => Math.min(window.devicePixelRatio || 1, 2);

const DrawCanvas = forwardRef<DrawCanvasHandle, DrawCanvasProps>(({
  strokes,
  canDraw,
  tool = 'pen',
  strokeColor = '#111111',
  strokeWidth = 4,
  onStroke,
  backgroundImageUrl = null,
  minHeight = 280,
  borderRadius = DRAW_CANVAS_BORDER_RADIUS,
  showBorder = true,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef(false);
  const currentPointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const optimisticStrokesRef = useRef<DrawStroke[]>([]);
  const pendingStrokeCountRef = useRef(0);
  const lastServerStrokeCountRef = useRef(0);
  const canvasSizeRef = useRef({ width: 0, height: 0, dpr: 0 });
  const committedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const committedGenerationRef = useRef(-1);
  const commitGenerationRef = useRef(0);
  const scheduleRedrawRef = useRef<(() => void) | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const canDrawRef = useRef(canDraw);
  canDrawRef.current = canDraw;

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }), []);

  const effectiveWidth = tool === 'eraser' ? strokeWidth * 2.5 : strokeWidth;
  const isEraser = tool === 'eraser';
  const isFill = tool === 'fill';

  const getNormalizedPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }, []);

  const bumpCommitGeneration = useCallback(() => {
    commitGenerationRef.current += 1;
  }, []);

  const paintStroke = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      stroke: DrawStroke,
      width: number,
      height: number
    ) => {
      const points = stroke.points;
      if (points.length < 2) {
        return;
      }

      const erasing = Boolean(stroke.isEraser);
      ctx.save();
      ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
      ctx.strokeStyle = erasing ? 'rgba(0,0,0,1)' : stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0].x * width, points[0].y * height);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x * width, points[i].y * height);
      }
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  const paintFill = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      stroke: DrawStroke
    ) => {
      const point = stroke.points[0];
      if (!point) {
        return;
      }
      floodFillCanvas(ctx, canvas, point, stroke.color);
    },
    []
  );

  const paintBackgroundImage = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const img = backgroundImageRef.current;
      if (!img) {
        return;
      }

      let drawWidth = img.width;
      let drawHeight = img.height;
      let x = 0;
      let y = 0;

      if (img.width > width || img.height > height) {
        const scale = Math.min(width / img.width, height / img.height);
        drawWidth = img.width * scale;
        drawHeight = img.height * scale;
      }

      x = (width - drawWidth) / 2;
      y = (height - drawHeight) / 2;
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    },
    []
  );

  const reconcileOptimisticStrokes = useCallback(() => {
    const serverCount = strokes.length;
    const optimisticBefore = optimisticStrokesRef.current.length;

    if (serverCount < lastServerStrokeCountRef.current) {
      optimisticStrokesRef.current = [];
      pendingStrokeCountRef.current = 0;
    } else {
      const confirmed = serverCount - lastServerStrokeCountRef.current;
      if (confirmed > 0 && pendingStrokeCountRef.current > 0) {
        const toRemove = Math.min(confirmed, pendingStrokeCountRef.current);
        optimisticStrokesRef.current = optimisticStrokesRef.current.slice(toRemove);
        pendingStrokeCountRef.current -= toRemove;
      }
    }

    if (optimisticBefore !== optimisticStrokesRef.current.length) {
      bumpCommitGeneration();
    }

    lastServerStrokeCountRef.current = serverCount;
  }, [bumpCommitGeneration, strokes.length]);

  const rebuildCommittedLayer = useCallback(
    (
      cssWidth: number,
      cssHeight: number,
      dpr: number,
      renderedStrokes: DrawStroke[]
    ) => {
      const pixelWidth = Math.floor(cssWidth * dpr);
      const pixelHeight = Math.floor(cssHeight * dpr);

      let committed = committedCanvasRef.current;
      if (!committed) {
        committed = document.createElement('canvas');
        committedCanvasRef.current = committed;
      }

      if (committed.width !== pixelWidth || committed.height !== pixelHeight) {
        committed.width = pixelWidth;
        committed.height = pixelHeight;
      }

      const ctx = committed.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cssWidth, cssHeight);
      paintBackgroundImage(ctx, cssWidth, cssHeight);

      renderedStrokes.forEach((stroke) => {
        if (stroke.isFill) {
          paintFill(ctx, committed!, stroke);
          return;
        }
        paintStroke(ctx, stroke, cssWidth, cssHeight);
      });

      committedGenerationRef.current = commitGenerationRef.current;
    },
    [paintBackgroundImage, paintFill, paintStroke]
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    reconcileOptimisticStrokes();

    const width = container.clientWidth;
    const height = Math.max(minHeight, Math.round(width * 0.75));
    const dpr = getCanvasDpr();

    const prevSize = canvasSizeRef.current;
    const needsResize =
      prevSize.width !== width || prevSize.height !== height || prevSize.dpr !== dpr;

    if (needsResize) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvasSizeRef.current = { width, height, dpr };
      bumpCommitGeneration();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const renderedStrokes = [
      ...strokes,
      ...optimisticStrokesRef.current,
    ];

    const needsCommittedRebuild =
      needsResize ||
      committedGenerationRef.current !== commitGenerationRef.current ||
      committedCanvasRef.current === null;

    if (needsCommittedRebuild) {
      rebuildCommittedLayer(width, height, dpr, renderedStrokes);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const committed = committedCanvasRef.current;
    if (committed) {
      ctx.drawImage(committed, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      paintBackgroundImage(ctx, width, height);
    }

    const livePoints = currentPointsRef.current;
    if (livePoints.length >= 2) {
      paintStroke(
        ctx,
        {
          points: livePoints,
          color: isEraser ? '#000000' : strokeColor,
          width: effectiveWidth,
          isEraser,
        },
        width,
        height
      );
    }
  }, [
    bumpCommitGeneration,
    effectiveWidth,
    isEraser,
    minHeight,
    paintBackgroundImage,
    paintStroke,
    rebuildCommittedLayer,
    reconcileOptimisticStrokes,
    strokeColor,
    strokes,
  ]);

  const scheduleRedraw = useCallback(() => {
    if (rafIdRef.current !== null) {
      return;
    }
    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null;
      redraw();
    });
  }, [redraw]);

  scheduleRedrawRef.current = scheduleRedraw;

  useEffect(() => {
    if (!backgroundImageUrl) {
      backgroundImageRef.current = null;
      bumpCommitGeneration();
      return;
    }

    const img = new Image();
    img.onload = () => {
      backgroundImageRef.current = img;
      bumpCommitGeneration();
      scheduleRedrawRef.current?.();
    };
    img.src = backgroundImageUrl;
  }, [backgroundImageUrl, bumpCommitGeneration]);

  useEffect(() => {
    bumpCommitGeneration();
  }, [bumpCommitGeneration, strokes.length]);

  useEffect(() => {
    redraw();
  }, [redraw, backgroundImageUrl]);

  useEffect(() => {
    if (!canDraw && drawingRef.current) {
      drawingRef.current = false;
      currentPointsRef.current = [];
      scheduleRedraw();
    }
  }, [canDraw, scheduleRedraw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => scheduleRedraw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [scheduleRedraw]);

  useEffect(
    () => () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const preventSelection = (event: Event) => {
      event.preventDefault();
    };

    container.addEventListener('selectstart', preventSelection);
    return () => container.removeEventListener('selectstart', preventSelection);
  }, []);

  const finishStroke = useCallback(() => {
    if (!drawingRef.current) {
      return;
    }
    drawingRef.current = false;
    const points = currentPointsRef.current;
    currentPointsRef.current = [];

    if (points.length >= 2 && canDrawRef.current) {
      const stroke: DrawStroke = {
        points,
        color: isEraser ? '#000000' : strokeColor,
        width: effectiveWidth,
        isEraser,
      };
      optimisticStrokesRef.current = [...optimisticStrokesRef.current, stroke];
      pendingStrokeCountRef.current += 1;
      bumpCommitGeneration();
      redraw();
      onStroke?.(stroke);
      return;
    }

    redraw();
  }, [bumpCommitGeneration, effectiveWidth, isEraser, onStroke, redraw, strokeColor]);

  const applyFill = useCallback(
    (point: { x: number; y: number }) => {
      if (!canDrawRef.current) {
        return;
      }

      const stroke: DrawStroke = {
        points: [point],
        color: strokeColor,
        width: 0,
        isFill: true,
      };
      optimisticStrokesRef.current = [...optimisticStrokesRef.current, stroke];
      pendingStrokeCountRef.current += 1;
      bumpCommitGeneration();
      redraw();
      onStroke?.(stroke);
    },
    [bumpCommitGeneration, onStroke, redraw, strokeColor]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) {
      return;
    }
    event.preventDefault();
    const point = getNormalizedPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    if (isFill) {
      applyFill(point);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    currentPointsRef.current = [point];
    scheduleRedraw();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canDraw || isFill) {
      return;
    }
    const point = getNormalizedPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    const points = currentPointsRef.current;
    const last = points[points.length - 1];
    if (last && Math.hypot(last.x - point.x, last.y - point.y) < 0.002) {
      return;
    }

    currentPointsRef.current = [...points, point];
    scheduleRedraw();
  };

  const handlePointerUp = () => {
    finishStroke();
  };

  const cursor = !canDraw ? 'default' : isFill ? 'pointer' : isEraser ? 'cell' : 'crosshair';

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        bgcolor: '#fff',
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        ...(showBorder
          ? {
              border: '1px solid',
              borderColor: 'divider',
            }
          : {
              border: 'none',
            }),
        ...drawCanvasInteractionSx,
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(event) => event.preventDefault()}
        style={{
          display: 'block',
          width: '100%',
          cursor,
          ...drawCanvasInteractionSx,
        }}
      />
    </Box>
  );
});

DrawCanvas.displayName = 'DrawCanvas';

export default DrawCanvas;
