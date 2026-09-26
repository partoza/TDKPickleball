export type PhotoOrientation = 'portrait' | 'landscape';

export interface PhotoAdjustment {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface ScheduleSlotArtwork {
  id: string;
  label: string;
  courtCount: number;
  courtNames: string[];
}

export const SOCIAL_TEMPLATES = {
  schedule: { src: '/assets/images/schedule-template.png', width: 1254, height: 1254 },
  portrait: { src: '/assets/images/portrait-bg.png', width: 945, height: 1268 },
  landscape: { src: '/assets/images/landscape-pg.png', width: 1461, height: 924 },
} as const;

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadCanvasImage(src: string) {
  if (!imageCache.has(src)) {
    imageCache.set(src, new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
      image.src = src;
    }));
  }
  return imageCache.get(src)!;
}

export async function renderScheduleArtwork(
  canvas: HTMLCanvasElement,
  dateLabel: string,
  slots: ScheduleSlotArtwork[],
) {
  const template = SOCIAL_TEMPLATES.schedule;
  const background = await loadCanvasImage(template.src);
  await Promise.all([
    document.fonts?.load('400 18px Poppins'),
    document.fonts?.load('500 28px Poppins'),
    document.fonts?.load('600 38px Poppins'),
  ]);
  canvas.width = template.width;
  canvas.height = template.height;
  const ctx = requiredContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(background, 0, 0, template.width, template.height);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(38, 2, 12, .60)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = 'rgba(255, 255, 255, .72)';
  ctx.font = '400 19px Poppins, Arial, sans-serif';
  drawSpacedText(ctx, 'COURT AVAILABILITY', template.width / 2, 292, 5);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 43px Poppins, Arial, sans-serif';
  ctx.fillText(dateLabel, template.width / 2, 340);

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 255, 255, .46)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(template.width / 2 - 82, 380);
  ctx.lineTo(template.width / 2 + 82, 380);
  ctx.stroke();

  const grid = { x: 108, y: 404, width: 1038, rowHeight: 184 };
  const cellWidth = grid.width / 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, .24)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(grid.x + cellWidth, grid.y);
  ctx.lineTo(grid.x + cellWidth, grid.y + grid.rowHeight * 3);
  for (let row = 1; row < 3; row++) {
    const y = grid.y + row * grid.rowHeight;
    ctx.moveTo(grid.x, y);
    ctx.lineTo(grid.x + grid.width, y);
  }
  ctx.stroke();

  if (!slots.length) {
    ctx.shadowColor = 'rgba(38, 2, 12, .55)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(255, 255, 255, .82)';
    ctx.font = '400 25px Poppins, Arial, sans-serif';
    ctx.fillText('Select up to 6 available schedules', template.width / 2, grid.y + grid.rowHeight * 1.5);
  }

  slots.slice(0, 6).forEach((slot, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const centerX = grid.x + cellWidth * column + cellWidth / 2;
    const centerY = grid.y + grid.rowHeight * row + grid.rowHeight / 2;

    ctx.shadowColor = 'rgba(38, 2, 12, .62)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, .62)';
    ctx.font = '400 16px Poppins, Arial, sans-serif';
    drawSpacedText(ctx, `SLOT ${String(index + 1).padStart(2, '0')}`, centerX, centerY - 55, 3.5);

    ctx.fillStyle = '#ffffff';
    ctx.font = '500 36px Poppins, Arial, sans-serif';
    ctx.fillText(slot.label, centerX, centerY - 4, cellWidth - 44);

    ctx.fillStyle = 'rgba(255, 255, 255, .78)';
    ctx.font = '400 22px Poppins, Arial, sans-serif';
    ctx.fillText(formatAvailableCourtLabel(slot.courtNames), centerX, centerY + 48, cellWidth - 44);
  });
  ctx.restore();
}

export function formatAvailableCourtLabel(courtNames: string[]) {
  const names = courtNames.map(name => name.trim()).filter(Boolean);
  if (!names.length) return 'No Courts Available';
  if (names.length === 1) return `${names[0]} Available`;

  const courtNumbers = names.map(name => name.match(/^Court\s+(.+)$/i)?.[1]);
  if (courtNumbers.every(Boolean)) {
    const values = courtNumbers as string[];
    const joined = values.length === 2
      ? `${values[0]} & ${values[1]}`
      : `${values.slice(0, -1).join(', ')} & ${values.at(-1)}`;
    return `Court ${joined} Available`;
  }

  const joined = names.length === 2
    ? `${names[0]} & ${names[1]}`
    : `${names.slice(0, -1).join(', ')} & ${names.at(-1)}`;
  return `${joined} Available`;
}

export async function renderPhotoArtwork(
  canvas: HTMLCanvasElement,
  photoSrc: string,
  orientation: PhotoOrientation,
  adjustment: PhotoAdjustment,
) {
  const template = SOCIAL_TEMPLATES[orientation];
  const [photo, overlay] = await Promise.all([loadCanvasImage(photoSrc), loadCanvasImage(template.src)]);
  canvas.width = template.width;
  canvas.height = template.height;
  const ctx = requiredContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCover(ctx, photo, canvas.width, canvas.height, adjustment);
  ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  adjustment: PhotoAdjustment,
) {
  const baseScale = Math.max(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);
  const scale = baseScale * adjustment.zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const overflowX = Math.max(0, width - targetWidth);
  const overflowY = Math.max(0, height - targetHeight);
  const x = (targetWidth - width) / 2 + adjustment.offsetX * overflowX / 200;
  const y = (targetHeight - height) / 2 + adjustment.offsetY * overflowY / 200;
  ctx.drawImage(image, x, y, width, height);
}

export function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed.')), 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function createStoredZip(files: Array<{ name: string; blob: Blob }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  const parts = [...localParts, ...centralParts, end];
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const outputBuffer = new ArrayBuffer(totalLength);
  const output = new Uint8Array(outputBuffer);
  let cursor = 0;
  parts.forEach(part => { output.set(part, cursor); cursor += part.length; });
  return new Blob([outputBuffer], { type: 'application/zip' });
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function drawSpacedText(ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number, spacing: number) {
  const characters = [...text];
  const widths = characters.map(character => ctx.measureText(character).width);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + spacing * Math.max(0, characters.length - 1);
  let x = centerX - totalWidth / 2;
  const originalAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  characters.forEach((character, index) => {
    ctx.fillText(character, x, y);
    x += widths[index] + spacing;
  });
  ctx.textAlign = originalAlign;
}

function requiredContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not supported by this browser.');
  return context;
}
