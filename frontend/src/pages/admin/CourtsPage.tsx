import { useState } from 'react';
import { PencilSquareIcon as Edit2, ArrowPathIcon as LoaderCircle, PlusIcon as Plus, PowerIcon as Power, NoSymbolIcon as PowerOff } from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import { useCourts, useCreateCourt, useUpdateCourt } from '@/hooks/useCourts';
import { Court } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AdminTimeSelect, hourlyOptions } from '@/components/admin/AdminFormControls';
import { getApiErrorMessage } from '@/services/api';

export default function CourtsPage() {
  const { data, isLoading } = useCourts(); const courts = data?.data || [];
  const create = useCreateCourt(); const update = useUpdateCourt();
  const [editing, setEditing] = useState<Court | null | undefined>(undefined);
  const [form, setForm] = useState({ name: '', displayName: '', openTime: '07:00', closeTime: '00:00' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const open = (court?: Court) => { setErrors({}); setEditing(court || null); setForm(court ? { name: court.name, displayName: court.displayName, openTime: court.openTime?.slice(0,5) || '07:00', closeTime: court.closeTime?.slice(0,5) || '00:00' } : { name: '', displayName: '', openTime: '07:00', closeTime: '00:00' }); };
  const save = () => {
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Enter a court name with at least 2 characters.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const opts = { onSuccess: (r: any) => { if (!r.success) return toast.error(r.message); toast.success(editing ? 'Court updated' : 'Court added'); setEditing(undefined); }, onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Unable to save court')) };
    if (editing) update.mutate({ id: editing.id, court: { ...form, isActive: editing.isActive, sortOrder: editing.sortOrder } }, opts); else create.mutate({ ...form, displayName: form.displayName || form.name }, opts);
  };
  const toggle = (court: Court) => update.mutate({ id: court.id, court: { ...court, isActive: !court.isActive } }, {
    onSuccess: response => {
      if (!response.success) return toast.error(response.message);
      toast.success(`Court marked ${court.isActive ? 'inactive' : 'active'}`);
    },
    onError: error => toast.error(getApiErrorMessage(error, `Court could not be marked ${court.isActive ? 'inactive' : 'active'}`)),
  });
  const pending = create.isPending || update.isPending;
  const paginatedCourts = courts.slice(page * 10, (page + 1) * 10);
  
  return <div className="space-y-6 max-w-[1500px] mx-auto"><div className="flex items-end justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Courts</h1><p className="mt-1 text-slate-500">Configure each court’s operating schedule.</p></div><Button onClick={() => open()}><Plus className="h-4 w-4" />Add Court</Button></div>
    <Card className="rounded-2xl"><CardHeader><CardTitle>All courts</CardTitle></CardHeader><CardContent>{isLoading ? <div className="space-y-3">{[1,2].map(x => <Skeleton key={x} className="h-14" />)}</div> : <div className="space-y-4">
      <div className="rounded-xl border hidden md:block"><Table><TableHeader><TableRow><TableHead>Court</TableHead><TableHead>Operating hours</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{paginatedCourts.map(c => <TableRow key={c.id}><TableCell><div className="font-medium">{c.name}</div><div className="text-xs text-slate-500">{c.displayName}</div></TableCell><TableCell>{time(c.openTime)}–{time(c.closeTime)}</TableCell><TableCell><Badge className={c.isActive ? 'bg-emerald-600' : ''} variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><TooltipProvider><Tooltip delayDuration={200}><TooltipTrigger asChild><Button size="icon" variant="ghost" onClick={() => open(c)}><Edit2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent className="bg-primary text-primary-foreground font-semibold rounded-lg px-2.5 py-1.5">Edit</TooltipContent></Tooltip></TooltipProvider><TooltipProvider><Tooltip delayDuration={200}><TooltipTrigger asChild><Button size="icon" variant="ghost" onClick={() => toggle(c)} disabled={update.isPending}>{c.isActive ? <PowerOff className="h-4 w-4 text-red-600" /> : <Power className="h-4 w-4 text-emerald-600" />}</Button></TooltipTrigger><TooltipContent className="bg-primary text-primary-foreground font-semibold rounded-lg px-2.5 py-1.5">{c.isActive ? 'Inactive' : 'Active'}</TooltipContent></Tooltip></TooltipProvider></div></TableCell></TableRow>)}</TableBody></Table></div>
      <div className="grid md:hidden gap-4">
        {paginatedCourts.map(c => (
          <div key={c.id} className="rounded-xl border p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div><div className="font-semibold text-lg">{c.name}</div><div className="text-xs text-slate-500">{c.displayName}</div></div>
              <Badge className={c.isActive ? 'bg-emerald-600' : ''} variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">{time(c.openTime)} - {time(c.closeTime)}</div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => open(c)}><Edit2 className="h-4 w-4" /> Edit</Button>
              <Button variant="outline" className={cn('flex-1 gap-2', c.isActive ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700')} onClick={() => toggle(c)} disabled={update.isPending}>{c.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />} {c.isActive ? 'Inactive' : 'Active'}</Button>
            </div>
          </div>
        ))}
      </div>
      {courts.length > 10 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">Showing {page * 10 + 1} to {Math.min((page + 1) * 10, courts.length)} of {courts.length}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * 10 >= courts.length} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>}</CardContent></Card>
    <Dialog open={editing !== undefined} onOpenChange={o => { if (!o) { setEditing(undefined); setErrors({}); } }}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit court' : 'Add court'}</DialogTitle><DialogDescription>All courts use the fixed operating schedule configured for the facility.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label>Court name *</Label><Input aria-invalid={!!errors.name} className={cn(errors.name && 'field-invalid')} value={form.name} onChange={e => { setForm({...form, name: e.target.value}); setErrors(v => ({...v, name: ''})); }} placeholder="Court 3" />{errors.name && <p className="field-error" role="alert">{errors.name}</p>}</div><div><Label>Display name</Label><Input value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} placeholder="Center Court" /></div><div className="grid grid-cols-2 gap-3"><div><Label>Opens</Label><AdminTimeSelect value="07:00" options={hourlyOptions(0, 23)} onChange={() => {}} disabled /></div><div><Label>Closes</Label><AdminTimeSelect value="00:00" options={hourlyOptions(1, 24)} onChange={() => {}} disabled /></div></div><p className="text-xs text-muted-foreground">Operating hours are fixed at 7:00 AM–12:00 midnight.</p></div><Button onClick={save} disabled={pending}>Save Court{pending && <LoaderCircle className="h-4 w-4 animate-spin" />}</Button></DialogContent></Dialog>
  </div>;
}
function time(value?: string) {
  const normalized = value?.match(/^(\d{1,2}):(\d{2})/)?.[0] || '00:00';
  const [hourValue, minute] = normalized.split(':').map(Number);
  if (!Number.isFinite(hourValue) || !Number.isFinite(minute)) return 'Not configured';
  const suffix = hourValue >= 12 ? 'PM' : 'AM';
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`;
}
