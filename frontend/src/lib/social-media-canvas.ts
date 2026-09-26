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
  await document.fonts?.load('700 48px Poppins');
  canvas.width = template.width;
  canvas.height = template.height;
  const ctx = requiredContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(background, 0, 0, template.width, template.height);

  const panel = { x: 154, y: 280, width: 946, height: 716, radius: 34 };
  ctx.save();
  ctx.shadowColor = 'rgba(15, 6, 8, .30)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 14;
  roundedRect(ctx, panel.x, panel.y, panel.width, panel.height, panel.radius);
  ctx.fillStyle = 'rgba(255, 255, 255, .95)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, panel.x, panel.y, panel.width, panel.height, panel.radius);
  ctx.clip();
  ctx.fillStyle = '#f4f4f6';
  ctx.fillRect(panel.x, panel.y, panel.width, 110);
  ctx.strokeStyle = 'rgba(22, 22, 24, .12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(panel.x, panel.y + 110);
  ctx.lineTo(panel.x + panel.width, panel.y + 110);
  ctx.stroke();

  ['#ff5f57', '#febc2e', '#28c840'].forEach((color, index) => {
    ctx.beginPath();
    ctx.arc(panel.x + 42 + index * 34, panel.y + 40, 10, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  ctx.fillStyle = '#6b6b70';
  ctx.font = '600 22px Poppins, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DAILY COURT SCHEDULE', panel.x + panel.width / 2, panel.y + 47);
  ctx.fillStyle = '#161618';
  ctx.font = '700 34px Poppins, Arial, sans-serif';
  ctx.fillText(dateLabel, panel.x + panel.width / 2, panel.y + 88);

  const gridX = panel.x + 42;
  const gridY = panel.y + 144;
  const gap = 20;
  const cellWidth = (panel.width - 84 - gap) / 2;
  const cellHeight = 158;

  if (!slots.length) {
    ctx.fillStyle = '#8e8e93';
    ctx.font = '600 30px Poppins, Arial, sans-serif';
    ctx.fillText('Select up to 6 available schedules', panel.x + panel.width / 2, panel.y + 430);
  }

  slots.slice(0, 6).forEach((slot, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = gridX + column * (cellWidth + gap);
    const y = gridY + row * (cellHeight + gap);

    roundedRect(ctx, x, y, cellWidth, cellHeight, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(22, 22, 24, .10)';
    ctx.lineWidth = 2;
    ctx.stroke();

    roundedRect(ctx, x + 22, y + 22, 54, 54, 15);
    ctx.fillStyle = '#72151d';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 26px Poppins, Arial, sans-serif';
    ctx.fillText(String(index + 1).padStart(2, '0'), x + 49, y + 59);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#161618';
    ctx.font = '700 27px Poppins, Arial, sans-serif';
    ctx.fillText(slot.label, x + 92, y + 57, cellWidth - 112);
    ctx.fillStyle = '#74747a';
    ctx.font = '500 19px Poppins, Arial, sans-serif';
    const courtLabel = `${slot.courtCount} ${slot.courtCount === 1 ? 'court' : 'courts'} available`;
    ctx.fillText(courtLabel, x + 92, y + 91, cellWidth - 112);

    ctx.fillStyle = '#f2f2f7';
    roundedRect(ctx, x + 22, y + 111, cellWidth - 44, 25, 13);
    ctx.fill();
    ctx.fillStyle = '#28a745';
    roundedRect(ctx, x + 22, y + 111, Math.max(80, (cellWidth - 44) * Math.min(1, slot.courtCount / 4)), 25, 13);
    ctx.fill();
    ctx.textAlign = 'center';
  });
  ctx.restore();
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

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function requiredContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not supported by this browser.');
  return context;
}
