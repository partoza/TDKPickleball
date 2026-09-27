import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import { useScheduleBoard } from '@/hooks/useSchedule';
import { getApiErrorMessage } from '@/services/api';
import { ScheduleStatus } from '@/types';
import { getManilaDate, isPastManilaStart } from '@/lib/manila-time';
import { Button } from '@/components/ui/button';
import { AdminDatePicker } from '@/components/admin/AdminFormControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  canvasToPng,
  createStoredZip,
  downloadBlob,
  formatAvailableCourtLabel,
  PhotoAdjustment,
  PhotoOrientation,
  renderPhotoArtwork,
  renderScheduleArtwork,
  SOCIAL_TEMPLATES,
} from '@/lib/social-media-canvas';

const MAX_SCHEDULE_SLOTS = 6;
const MAX_PHOTOS = 20;
const DEFAULT_ADJUSTMENT: PhotoAdjustment = { zoom: 1, offsetX: 0, offsetY: 0 };
const ACCEPTED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface UploadedPhoto {
  id: string;
  file: File;
  url: string;
  adjustment: PhotoAdjustment;
}

interface GeneratedPhoto {
  id: string;
  name: string;
  blob: Blob;
  url: string;
}

export default function SocialMediaPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-12 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 pl-1">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-50">Social Media Generator</h1>
        <p className="mt-2 max-w-[600px] text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">
          Create daily availability posts or frame up to 20 photos using the official templates. All photo processing stays in this browser.
        </p>
      </div>

      <Tabs defaultValue="schedule" className="space-y-5">
        <TabsList className="h-11 w-full justify-start rounded-xl bg-black/[.055] p-1 dark:bg-white/[.08] sm:w-auto">
          <TabsTrigger value="schedule" className="h-9 flex-1 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:flex-none">Schedule Post</TabsTrigger>
          <TabsTrigger value="photos" className="h-9 flex-1 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:flex-none">Photo Posts</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-0"><ScheduleGenerator /></TabsContent>
        <TabsContent value="photos" className="mt-0"><PhotoGenerator /></TabsContent>
      </Tabs>
    </div>
  );
}

function ScheduleGenerator() {
  const [date, setDate] = useState(getManilaDate());
  const [selected, setSelected] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: response, isLoading, isFetching, isError, error } = useScheduleBoard(date);
  const board = response?.data;

  const availableSlots = useMemo(() => (board?.timeSlots || []).map(slot => {
    const availableCourts = (board?.courts || []).filter(court => {
      const schedule = court.schedules.find(item => item.startTime === slot.startTime);
      return !schedule || schedule.status === ScheduleStatus.Available;
    });
    return {
      id: `${slot.startTime}-${slot.endTime}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: formatTimeRange(slot.startTime, slot.endTime),
      courtCount: availableCourts.length,
      courtNames: availableCourts.map(item => item.court.displayName || item.court.name),
    };
  }).filter(slot => slot.courtCount > 0 && !isPastManilaStart(date, slot.startTime)), [board, date]);

  useEffect(() => {
    if (!board) return;
    setSelected(availableSlots.slice(0, MAX_SCHEDULE_SLOTS).map(slot => slot.id));
  }, [board, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedSlots = availableSlots.filter(slot => selected.includes(slot.id));
  const dateLabel = format(new Date(`${date}T00:00:00`), 'MMMM d, yyyy').toUpperCase();

  useEffect(() => {
    if (!canvasRef.current) return;
    renderScheduleArtwork(canvasRef.current, dateLabel, selectedSlots).catch(() => {
      toast.error('The schedule template could not be loaded.');
    });
  }, [dateLabel, selectedSlots]);

  const toggleSlot = (id: string) => {
    setSelected(current => {
      if (current.includes(id)) return current.filter(item => item !== id);
      if (current.length >= MAX_SCHEDULE_SLOTS) {
        toast.info('One template can contain up to 6 schedules.');
        return current;
      }
      return [...current, id];
    });
  };

  const downloadSchedule = async () => {
    if (!selectedSlots.length || !canvasRef.current) {
      toast.error('Select at least one available schedule.');
      return;
    }
    try {
      const blob = await canvasToPng(canvasRef.current);
      downloadBlob(blob, scheduleOutputName(date));
      toast.success('Schedule PNG downloaded.');
    } catch {
      toast.error('The schedule image could not be exported.');
    }
  };

  if (isLoading || isFetching) return <AdminPageSkeleton layout="table" className="px-0 pb-0" label="Loading social media schedules" />;

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
      <Card className="overflow-hidden rounded-2xl border-black/10 shadow-sm dark:border-white/10">
        <CardHeader className="border-b bg-muted/25">
          <CardTitle className="flex items-center gap-2 text-lg"><CalendarDaysIcon className="h-5 w-5 text-primary" /> Daily schedule</CardTitle>
          <CardDescription>Choose one date and up to six available schedules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="flex flex-col gap-1.5">
            <label className="block pl-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Post date</label>
            <AdminDatePicker value={date} onChange={setDate} />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Available schedules</p>
                <p className="text-xs text-muted-foreground">{selected.length} of {MAX_SCHEDULE_SLOTS} selected</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setSelected(availableSlots.slice(0, MAX_SCHEDULE_SLOTS).map(slot => slot.id))} disabled={!availableSlots.length}>Select 6</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected([])} disabled={!selected.length}>Clear</Button>
              </div>
            </div>

            {isError ? <InlineError text={getApiErrorMessage(error, 'Unable to retrieve schedules.')} />
                : availableSlots.length ? <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
                  {availableSlots.map(slot => {
                    const checked = selected.includes(slot.id);
                    return <button key={slot.id} type="button" onClick={() => toggleSlot(slot.id)} aria-pressed={checked} className={cn('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all', checked ? 'border-primary bg-primary/[.07] shadow-sm' : 'border-border bg-background hover:border-primary/35 hover:bg-muted/35')}>
                      <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-md border', checked ? 'border-primary bg-primary text-white' : 'border-border bg-background')}>
                        {checked && <CheckCircleIcon className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{slot.label}</span><span className="block text-[11px] text-muted-foreground">{formatAvailableCourtLabel(slot.courtNames)}</span></span>
                    </button>;
                  })}
                </div> : <div className="rounded-xl border border-dashed p-7 text-center"><CalendarDaysIcon className="mx-auto h-8 w-8 text-muted-foreground/50" /><p className="mt-2 text-sm font-semibold">No available schedules</p><p className="mt-1 text-xs text-muted-foreground">Try a different date.</p></div>}
          </div>
          <Button className="h-11 w-full rounded-xl" onClick={downloadSchedule} disabled={!selected.length || isFetching}><ArrowDownTrayIcon /> Download PNG</Button>
        </CardContent>
      </Card>

      <PreviewShell label="Live preview" dimensions={`${SOCIAL_TEMPLATES.schedule.width} × ${SOCIAL_TEMPLATES.schedule.height} PNG`}>
        <canvas ref={canvasRef} className="block h-auto w-full max-w-[780px] rounded-xl shadow-2xl" aria-label="Schedule social media preview" />
      </PreviewShell>
    </div>
  );
}

function PhotoGenerator() {
  const [orientation, setOrientation] = useState<PhotoOrientation>('portrait');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [activeId, setActiveId] = useState('');
  const [generated, setGenerated] = useState<GeneratedPhoto[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadUrls = useRef(new Set<string>());
  const generatedUrls = useRef(new Set<string>());
  const activePhoto = photos.find(photo => photo.id === activeId) || photos[0];
  const template = SOCIAL_TEMPLATES[orientation];

  useEffect(() => () => {
    uploadUrls.current.forEach(URL.revokeObjectURL);
    generatedUrls.current.forEach(URL.revokeObjectURL);
  }, []);

  useEffect(() => {
    if (!previewRef.current) return;
    if (!activePhoto) {
      previewRef.current.width = template.width;
      previewRef.current.height = template.height;
      const context = previewRef.current.getContext('2d');
      if (context) { context.fillStyle = '#ececef'; context.fillRect(0, 0, template.width, template.height); }
      return;
    }
    renderPhotoArtwork(previewRef.current, activePhoto.url, orientation, activePhoto.adjustment).catch(() => toast.error('This photo could not be previewed.'));
  }, [activePhoto, orientation, template]);

  const acceptFiles = async (incoming: File[]) => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) { toast.error('A batch can contain no more than 20 photos.'); return; }
    const supported = incoming.filter(file => ACCEPTED_PHOTO_TYPES.has(file.type));
    if (supported.length !== incoming.length) toast.error('Only JPG, PNG, and WEBP photos are supported.');
    if (supported.length > remaining) toast.info(`Only the first ${remaining} photos were added.`);
    const accepted: UploadedPhoto[] = [];
    for (const file of supported.slice(0, remaining)) {
      try {
        const bitmap = await createImageBitmap(file);
        bitmap.close();
        const url = URL.createObjectURL(file);
        uploadUrls.current.add(url);
        accepted.push({ id: crypto.randomUUID(), file, url, adjustment: { ...DEFAULT_ADJUSTMENT } });
      } catch {
        toast.error(`${file.name} is corrupted or unreadable.`);
      }
    }
    if (accepted.length) {
      setPhotos(current => [...current, ...accepted]);
      setActiveId(current => current || accepted[0].id);
    }
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    void acceptFiles(Array.from(event.target.files || []));
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    void acceptFiles(Array.from(event.dataTransfer.files));
  };

  const removePhoto = (id: string) => {
    setPhotos(current => {
      const removed = current.find(photo => photo.id === id);
      if (removed) { URL.revokeObjectURL(removed.url); uploadUrls.current.delete(removed.url); }
      const next = current.filter(photo => photo.id !== id);
      if (activeId === id) setActiveId(next[0]?.id || '');
      return next;
    });
  };

  const updateAdjustment = (key: keyof PhotoAdjustment, value: number) => {
    if (!activePhoto) return;
    setPhotos(current => current.map(photo => photo.id === activePhoto.id ? { ...photo, adjustment: { ...photo.adjustment, [key]: value } } : photo));
  };

  const clearGenerated = () => {
    generatedUrls.current.forEach(URL.revokeObjectURL);
    generatedUrls.current.clear();
    setGenerated([]);
  };

  const generate = async () => {
    if (!photos.length) { toast.error('Upload at least one photo first.'); return; }
    setIsGenerating(true);
    setProgress(0);
    clearGenerated();
    const results: GeneratedPhoto[] = [];
    const generatedOn = getManilaDate();
    try {
      for (let index = 0; index < photos.length; index++) {
        const photo = photos[index];
        const canvas = document.createElement('canvas');
        await renderPhotoArtwork(canvas, photo.url, orientation, photo.adjustment);
        const blob = await canvasToPng(canvas);
        const url = URL.createObjectURL(blob);
        generatedUrls.current.add(url);
        results.push({ id: photo.id, name: photoOutputName(orientation, generatedOn, index), blob, url });
        setGenerated([...results]);
        setProgress(index + 1);
        await new Promise(resolve => window.setTimeout(resolve, 0));
      }
      toast.success(`${results.length} ${results.length === 1 ? 'image' : 'images'} generated.`);
    } catch {
      toast.error('Image generation stopped because a photo could not be processed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAll = async () => {
    if (!generated.length) return;
    try {
      const zip = await createStoredZip(generated.map(item => ({ name: item.name, blob: item.blob })));
      downloadBlob(zip, photoArchiveName(orientation, getManilaDate()));
    } catch {
      toast.error('The ZIP file could not be created.');
    }
  };

  return <div className="space-y-6">
    <div className="grid items-start gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
      <Card className="overflow-hidden rounded-2xl border-black/10 shadow-sm dark:border-white/10">
        <CardHeader className="border-b bg-muted/25"><CardTitle className="flex items-center gap-2 text-lg"><PhotoIcon className="h-5 w-5 text-primary" /> Photo settings</CardTitle><CardDescription>Photos remain local and are cleared when this page refreshes.</CardDescription></CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orientation</p><div className="grid grid-cols-2 gap-2">{(['portrait', 'landscape'] as const).map(value => <button key={value} type="button" aria-pressed={orientation === value} onClick={() => setOrientation(value)} className={cn('rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition-all', orientation === value ? 'border-primary bg-primary text-white shadow-sm' : 'bg-background hover:border-primary/40')}>{value}<span className="mt-0.5 block text-[10px] font-normal opacity-75">{SOCIAL_TEMPLATES[value].width} × {SOCIAL_TEMPLATES[value].height}</span></button>)}</div></div>

          <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upload photos</p><span className="text-xs font-semibold text-muted-foreground">{photos.length} / {MAX_PHOTOS}</span></div>
            <div onDragOver={event => event.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current?.click()} className="grid min-h-32 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/20 p-5 text-center transition-colors hover:border-primary/45 hover:bg-primary/[.03]">
              <div><ArrowUpTrayIcon className="mx-auto h-7 w-7 text-primary" /><p className="mt-2 text-sm font-semibold">Drop photos here</p><p className="mt-1 text-xs text-muted-foreground">or click to browse JPG, PNG, WEBP</p></div>
            </div>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onFileInput} />
          </div>

          {photos.length > 0 && <div className="grid grid-cols-5 gap-2">{photos.map((photo, index) => <button key={photo.id} type="button" onClick={() => setActiveId(photo.id)} className={cn('group relative aspect-square overflow-hidden rounded-lg border-2', activePhoto?.id === photo.id ? 'border-primary' : 'border-transparent')}><img src={photo.url} alt={`Uploaded photo ${index + 1}`} className="h-full w-full object-cover" /><span onClick={event => { event.stopPropagation(); removePhoto(photo.id); }} className="absolute right-1 top-1 hidden h-6 w-6 place-items-center rounded-md bg-black/70 text-white group-hover:grid"><TrashIcon className="h-3.5 w-3.5" /></span></button>)}</div>}

          {activePhoto && <div className="space-y-3 rounded-xl border bg-muted/20 p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold truncate">{activePhoto.file.name}</p><Button size="sm" variant="ghost" onClick={() => updateAdjustment('zoom', 1)}>Reset</Button></div><RangeControl label="Zoom" min={1} max={2} step={0.01} value={activePhoto.adjustment.zoom} onChange={value => updateAdjustment('zoom', value)} /><RangeControl label="Horizontal position" min={-100} max={100} step={1} value={activePhoto.adjustment.offsetX} onChange={value => updateAdjustment('offsetX', value)} /><RangeControl label="Vertical position" min={-100} max={100} step={1} value={activePhoto.adjustment.offsetY} onChange={value => updateAdjustment('offsetY', value)} /></div>}

          <Button className="h-11 w-full rounded-xl" onClick={generate} disabled={!photos.length || isGenerating}><SparklesIcon />{isGenerating ? `Generating ${progress} / ${photos.length}` : `Generate ${photos.length || ''} ${photos.length === 1 ? 'image' : 'images'}`}</Button>
          {isGenerating && <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${photos.length ? progress / photos.length * 100 : 0}%` }} /></div>}
        </CardContent>
      </Card>

      <PreviewShell label="Photo preview" dimensions={`${template.width} × ${template.height} PNG`}>
        {activePhoto ? <canvas ref={previewRef} className={cn('block h-auto w-full rounded-xl shadow-2xl', orientation === 'portrait' ? 'max-w-[570px]' : 'max-w-[880px]')} aria-label="Photo post preview" /> : <div className={cn('grid w-full place-items-center rounded-xl border-2 border-dashed border-border/80 bg-muted/25 px-6 text-center', orientation === 'portrait' ? 'max-w-[570px]' : 'max-w-[880px]')} style={{ aspectRatio: `${template.width} / ${template.height}` }}>
          <div className="max-w-sm">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><PhotoIcon className="h-8 w-8" /></span>
            <p className="mt-4 text-base font-semibold text-foreground">Your photo preview will appear here</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Upload a JPG, PNG, or WEBP image to see it framed with the official {orientation} template.</p>
          </div>
        </div>}
      </PreviewShell>
    </div>

    {generated.length > 0 && <Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle className="text-lg">Generated images</CardTitle><CardDescription>{generated.length} high-quality PNG {generated.length === 1 ? 'image' : 'images'} ready to download.</CardDescription></div><Button onClick={downloadAll}><ArrowDownTrayIcon /> Download ZIP</Button></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{generated.map(item => <div key={item.id} className="overflow-hidden rounded-xl border bg-muted/20"><img src={item.url} alt={item.name} className="h-auto w-full" /><div className="flex items-center justify-between gap-2 border-t p-3"><p className="min-w-0 truncate text-xs font-medium">{item.name}</p><Button size="sm" variant="outline" onClick={() => downloadBlob(item.blob, item.name)}><ArrowDownTrayIcon /> PNG</Button></div></div>)}</CardContent></Card>}
  </div>;
}

function PreviewShell({ label, dimensions, children }: { label: string; dimensions: string; children: React.ReactNode }) {
  return <Card className="overflow-hidden rounded-2xl border-black/10 shadow-sm dark:border-white/10"><CardHeader className="border-b bg-muted/25 py-4"><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-base">{label}</CardTitle><CardDescription>Scaled preview · export remains full resolution</CardDescription></div><span className="rounded-lg border bg-background px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{dimensions}</span></div></CardHeader><CardContent className="grid min-h-[620px] place-items-center bg-[radial-gradient(circle_at_top,rgba(114,21,29,.09),transparent_58%)] p-4 sm:p-7">{children}</CardContent></Card>;
}

function RangeControl({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (value: number) => void }) {
  return <label className="block"><span className="mb-1.5 flex justify-between text-[11px] font-medium text-muted-foreground"><span>{label}</span><span>{label === 'Zoom' ? `${value.toFixed(2)}×` : `${Math.round(value)}%`}</span></span><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className="h-1.5 w-full cursor-pointer accent-primary" /></label>;
}

function InlineError({ text }: { text: string }) {
  return <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"><ExclamationTriangleIcon className="h-5 w-5 shrink-0" /><p>{text}</p></div>;
}

function formatTimeRange(start: string, end: string) {
  const formatOne = (value: string) => format(new Date(`2000-01-01T${value}`), 'h:mm a');
  return `${formatOne(start)} – ${formatOne(end)}`;
}

function scheduleOutputName(date: string) {
  return `TDK-Court-Availability-${date}.png`;
}

function photoOutputName(orientation: PhotoOrientation, date: string, index: number) {
  return `TDK-${capitalize(orientation)}-Post-${date}-${String(index + 1).padStart(2, '0')}.png`;
}

function photoArchiveName(orientation: PhotoOrientation, date: string) {
  return `TDK-${capitalize(orientation)}-Posts-${date}.zip`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
