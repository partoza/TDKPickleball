import { useState } from 'react';
import { format } from 'date-fns';
import { ExclamationTriangleIcon as AlertTriangle, PencilSquareIcon as Edit2, ArrowPathIcon as LoaderCircle, PlusIcon as Plus, TrashIcon as Trash2 } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useCreateRate, useDeleteRate, useRates, useUpdateRate } from '@/hooks/useRates';
import { Rate, RateType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AdminTimeSelect, hourlyOptions } from '@/components/admin/AdminFormControls';

const defaultForm = { startTime: '07:00', endTime: '17:00', pricePerHour: 320, rateType: RateType.Booking };

export default function RatesPage() {
  const { data, isLoading } = useRates();
  const rates = data?.data || [];
  const create = useCreateRate();
  const update = useUpdateRate();
  const remove = useDeleteRate();
  const [editing, setEditing] = useState<Rate | null | undefined>(undefined);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);

  const open = (rate?: Rate) => {
    setErrors({});
    setEditing(rate || null);
    setForm(rate ? {
      startTime: rate.startTime.slice(0, 5),
      endTime: rate.endTime.slice(0, 5),
      pricePerHour: rate.pricePerHour,
      rateType: rate.rateType || RateType.Booking,
    } : defaultForm);
  };

  const save = () => {
    const nextErrors: Record<string, string> = {};
    if (form.pricePerHour <= 0) nextErrors.pricePerHour = 'Rate must be greater than zero.';
    if (form.endTime !== '00:00' && form.startTime >= form.endTime) nextErrors.endTime = 'End time must be after start time.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const options = {
      onSuccess: (response: any) => {
        if (!response.success) return toast.error(response.message);
        toast.success(editing ? 'Rate updated' : 'Rate added');
        setEditing(undefined);
      },
      onError: (error: any) => toast.error(error.response?.data?.message || 'Unable to save rate'),
    };
    if (editing) update.mutate({ id: editing.id, rate: { ...form, isActive: editing.isActive } }, options);
    else create.mutate(form, options);
  };

  const pending = create.isPending || update.isPending;

  return <div className="space-y-6">
    <div className="flex items-end justify-between">
      <div><h1 className="text-3xl font-bold tracking-tight">Rates</h1><p className="mt-1 text-slate-500">Customize pricing for bookings, training, and free play.</p></div>
      <Button onClick={() => open()}><Plus className="h-4 w-4" />Add Rate</Button>
    </div>

    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <p>Ranges cannot overlap within the same rate type. Different types may use the same hours.</p>
    </div>

    <Card className="rounded-2xl"><CardHeader><CardTitle>Pricing schedule</CardTitle></CardHeader><CardContent>
      {isLoading ? <div className="space-y-3">{[1, 2].map(x => <Skeleton key={x} className="h-14" />)}</div> :
        <div className="space-y-4">
          <div className="rounded-xl border hidden md:block"><Table><TableHeader><TableRow>
            <TableHead>Pricing ID</TableHead><TableHead>Rate type</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Rate / hour</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader><TableBody>{rates.slice(page * 10, (page + 1) * 10).map(rate => <TableRow key={rate.id}>
            <TableCell className="font-mono text-xs font-bold text-primary">{pricingId(rate, rates)}</TableCell>
            <TableCell><RateTypeBadge type={rate.rateType || RateType.Booking} /></TableCell>
            <TableCell>{time(rate.startTime)}</TableCell><TableCell>{time(rate.endTime)}</TableCell>
            <TableCell className="font-semibold">₱{rate.pricePerHour.toLocaleString()}</TableCell>
            <TableCell>{rate.isActive ? 'Active' : 'Inactive'}</TableCell>
            <TableCell><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" onClick={() => open(rate)}><Edit2 className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-red-600" onClick={() => remove.mutate(rate.id, { onSuccess: () => toast.success('Rate removed'), onError: () => toast.error('Rate could not be removed') })}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
          </TableRow>)}</TableBody></Table></div>
          
          <div className="grid md:hidden gap-4">
            {rates.slice(page * 10, (page + 1) * 10).map(rate => (
              <div key={rate.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-primary">{pricingId(rate, rates)}</span><RateTypeBadge type={rate.rateType || RateType.Booking} /></div>
                  <span className="font-semibold text-lg">₱{rate.pricePerHour.toLocaleString()}</span>
                </div>
                <div className="text-sm text-muted-foreground flex justify-between">
                  <span>{time(rate.startTime)} - {time(rate.endTime)}</span>
                  <span>{rate.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => open(rate)}><Edit2 className="h-4 w-4" /> Edit</Button>
                  <Button variant="outline" className="flex-1 gap-2 text-red-600 hover:text-red-700" onClick={() => remove.mutate(rate.id, { onSuccess: () => toast.success('Rate removed'), onError: () => toast.error('Rate could not be removed') })}><Trash2 className="h-4 w-4" /> Delete</Button>
                </div>
              </div>
            ))}
          </div>

          {rates.length > 10 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">Showing {page * 10 + 1} to {Math.min((page + 1) * 10, rates.length)} of {rates.length}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</Button>
                <Button variant="outline" size="sm" disabled={(page + 1) * 10 >= rates.length} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>}
    </CardContent></Card>

    <Dialog open={editing !== undefined} onOpenChange={openState => { if (!openState) { setEditing(undefined); setErrors({}); } }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? 'Edit rate' : 'Add rate'}</DialogTitle><DialogDescription>Choose who this price applies to, its time range, and hourly amount.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Rate type *</Label><Select value={form.rateType} onValueChange={(value: RateType) => setForm({ ...form, rateType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={RateType.Booking}>Booking</SelectItem><SelectItem value={RateType.Training}>Training</SelectItem><SelectItem value={RateType.FreePlay}>Free Play</SelectItem></SelectContent></Select></div>
          <div><Label>Start time</Label><AdminTimeSelect value={form.startTime} options={hourlyOptions(0, 23)} onChange={value => { setForm({ ...form, startTime: value }); setErrors(e => ({...e, endTime: ''})); }} /></div>
          <div><Label>End time</Label><AdminTimeSelect invalid={!!errors.endTime} value={form.endTime} options={hourlyOptions(1, 24)} onChange={value => { setForm({ ...form, endTime: value }); setErrors(e => ({...e, endTime: ''})); }} />{errors.endTime && <p className="field-error" role="alert">{errors.endTime}</p>}</div>
          <div className="sm:col-span-2"><Label>Hourly rate (₱)</Label><Input aria-invalid={!!errors.pricePerHour} className={cn(errors.pricePerHour && 'field-invalid')} type="number" min="1" value={form.pricePerHour} onChange={event => { setForm({ ...form, pricePerHour: Number(event.target.value) }); setErrors(e => ({...e, pricePerHour: ''})); }} />{errors.pricePerHour && <p className="field-error" role="alert">{errors.pricePerHour}</p>}</div>
        </div>
        <Button disabled={pending} onClick={save}>Save Rate{pending && <LoaderCircle className="h-4 w-4 animate-spin" />}</Button>
      </DialogContent>
    </Dialog>
  </div>;
}

function RateTypeBadge({ type }: { type: RateType }) {
  const colors = type === RateType.Training ? 'bg-orange-100 text-orange-800' : type === RateType.FreePlay ? 'bg-violet-100 text-violet-800' : 'bg-primary/10 text-primary';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors}`}>{type === RateType.FreePlay ? 'Free Play' : type}</span>;
}

function time(value: string) { return format(new Date(`2000-01-01T${value}`), 'h:mm a'); }
function pricingId(rate: Rate, rates: Rate[]) {
  const type = rate.rateType || RateType.Booking;
  const prefix = type === RateType.Booking ? 'BK' : type === RateType.Training ? 'TR' : 'FP';
  const siblings = rates.filter(item => (item.rateType || RateType.Booking) === type).sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id - b.id);
  return `${prefix}-${siblings.findIndex(item => item.id === rate.id) + 1}`;
}
