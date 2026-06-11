const parseHexColor = (color: string) => {
  const normalized = color.trim();
  if (!normalized.startsWith('#')) {
    return { r: 0, g: 0, b: 0 };
  }

  const hex = normalized.slice(1);
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }

  if (hex.length >= 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  return { r: 0, g: 0, b: 0 };
};

const colorsEqual = (
  r1: number,
  g1: number,
  b1: number,
  a1: number,
  r2: number,
  g2: number,
  b2: number,
  a2: number
) => r1 === r2 && g1 === g2 && b1 === b2 && a1 === a2;

export const floodFillCanvas = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  normalizedPoint: { x: number; y: number },
  fillColor: string
) => {
  const width = canvas.width;
  const height = canvas.height;
  if (width <= 0 || height <= 0) {
    return;
  }

  const startX = Math.min(width - 1, Math.max(0, Math.floor(normalizedPoint.x * width)));
  const startY = Math.min(height - 1, Math.max(0, Math.floor(normalizedPoint.y * height)));
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const startIndex = (startY * width + startX) * 4;
  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];
  const targetA = data[startIndex + 3];
  const fill = parseHexColor(fillColor);

  if (colorsEqual(targetR, targetG, targetB, targetA, fill.r, fill.g, fill.b, 255)) {
    return;
  }

  const matchesTarget = (index: number) =>
    colorsEqual(
      data[index],
      data[index + 1],
      data[index + 2],
      data[index + 3],
      targetR,
      targetG,
      targetB,
      targetA
    );

  const stack: Array<[number, number]> = [[startX, startY]];

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const index = (y * width + x) * 4;

    if (!matchesTarget(index)) {
      continue;
    }

    data[index] = fill.r;
    data[index + 1] = fill.g;
    data[index + 2] = fill.b;
    data[index + 3] = 255;

    if (x > 0) {
      stack.push([x - 1, y]);
    }
    if (x < width - 1) {
      stack.push([x + 1, y]);
    }
    if (y > 0) {
      stack.push([x, y - 1]);
    }
    if (y < height - 1) {
      stack.push([x, y + 1]);
    }
  }

  ctx.putImageData(imageData, 0, 0);
};
