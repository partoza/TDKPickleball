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
  schedule: { src: '/assets/images/schedule-socmed.png', width: 1254, height: 1254 },
  portrait: { src: '/assets/images/portrait-socmedia.png', width: 945, height: 1268 },
  landscape: { src: '/assets/images/landscape-socmediaa.png', width: 1461, height: 924 },
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
    document.fonts?.load('400 34px Poppins'),
    document.fonts?.load('500 64px Poppins'),
    document.fonts?.load('600 43px Poppins'),
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

  const grid = { x: 64, y: 396, width: 1126, rowHeight: 205, maxRows: 3 };
  const cellWidth = grid.width / 2;
  const selectedSlots = slots.slice(0, 6);
  const typography = scheduleTypography(selectedSlots.length);
  const stackTwoSlots = selectedSlots.length === 2;
  const rowCount = stackTwoSlots ? 2 : Math.ceil(selectedSlots.length / 2);
  const contentHeight = rowCount * grid.rowHeight;
  const contentY = grid.y + (grid.rowHeight * grid.maxRows - contentHeight) / 2;

  ctx.strokeStyle = 'rgba(255, 255, 255, .24)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let row = 0; row < rowCount; row++) {
    if (!stackTwoSlots && selectedSlots.length - row * 2 >= 2) {
      const top = contentY + row * grid.rowHeight;
      ctx.moveTo(grid.x + cellWidth, top);
      ctx.lineTo(grid.x + cellWidth, top + grid.rowHeight);
    }
  }
  for (let row = 1; row < rowCount; row++) {
    const y = contentY + row * grid.rowHeight;
    ctx.moveTo(grid.x, y);
    ctx.lineTo(grid.x + grid.width, y);
  }
  ctx.stroke();

  if (!slots.length) {
    ctx.shadowColor = 'rgba(38, 2, 12, .55)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(255, 255, 255, .82)';
    ctx.font = '400 25px Poppins, Arial, sans-serif';
    ctx.fillText('Select up to 6 available schedules', template.width / 2, grid.y + grid.rowHeight * grid.maxRows / 2);
  }

  selectedSlots.forEach((slot, index) => {
    const column = index % 2;
    const row = stackTwoSlots ? index : Math.floor(index / 2);
    const isCenteredLastSlot = stackTwoSlots || (selectedSlots.length % 2 === 1 && index === selectedSlots.length - 1);
    const centerX = isCenteredLastSlot ? template.width / 2 : grid.x + cellWidth * column + cellWidth / 2;
    const centerY = contentY + grid.rowHeight * row + grid.rowHeight / 2;
    const textWidth = selectedSlots.length <= 2 ? grid.width - 120 : cellWidth - 36;

    ctx.shadowColor = 'rgba(38, 2, 12, .62)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, .62)';
    ctx.font = `400 ${typography.slot}px Poppins, Arial, sans-serif`;
    drawSpacedText(ctx, `SLOT ${String(index + 1).padStart(2, '0')}`, centerX, centerY + typography.slotY, typography.tracking);

    ctx.fillStyle = '#ffffff';
    setFittedFont(ctx, slot.label, 500, typography.time, typography.minimumTime, textWidth);
    ctx.fillText(slot.label, centerX, centerY + typography.timeY);

    ctx.fillStyle = 'rgba(255, 255, 255, .78)';
    const availabilityLabel = formatAvailableCourtLabel(slot.courtNames);
    setFittedFont(ctx, availabilityLabel, 400, typography.availability, 24, textWidth);
    ctx.fillText(availabilityLabel, centerX, centerY + typography.availabilityY);
  });
  ctx.restore();
}

function scheduleTypography(slotCount: number) {
  if (slotCount <= 1) return { slot: 22, time: 64, minimumTime: 52, availability: 34, slotY: -79, timeY: -5, availabilityY: 73, tracking: 4.5 };
  if (slotCount === 2) return { slot: 21, time: 58, minimumTime: 48, availability: 33, slotY: -76, timeY: -5, availabilityY: 70, tracking: 4.25 };
  if (slotCount <= 4) return { slot: 18, time: 46, minimumTime: 40, availability: 28, slotY: -68, timeY: -5, availabilityY: 61, tracking: 3.75 };
  return { slot: 17, time: 42, minimumTime: 38, availability: 26, slotY: -64, timeY: -5, availabilityY: 57, tracking: 3.5 };
}

function setFittedFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  preferredSize: number,
  minimumSize: number,
  maxWidth: number,
) {
  ctx.font = `${weight} ${preferredSize}px Poppins, Arial, sans-serif`;
  const measuredWidth = ctx.measureText(text).width;
  const size = measuredWidth > maxWidth
    ? Math.max(minimumSize, Math.floor(preferredSize * maxWidth / measuredWidth))
    : preferredSize;
  ctx.font = `${weight} ${size}px Poppins, Arial, sans-serif`;
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
