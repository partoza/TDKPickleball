import React, { useEffect, useState } from 'react';
import { usePromos } from '@/hooks/usePromos';
import { Promo, DiscountType, RateType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusIcon as Plus, ReceiptPercentIcon as Percent, CalendarDaysIcon as Calendar, UsersIcon as Users, PencilIcon as Pencil, TrashIcon as Trash } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { AdminDatePicker } from '@/components/admin/AdminFormControls';
import { AdminCredentialDeleteDialog } from '@/components/admin/AdminCredentialDeleteDialog';
import { TablePagination } from '@/components/admin/TablePagination';
import { getPromoValidity } from '@/lib/promo-availability';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

export default function PromosPage() {
  const { promos, loading, fetchPromos, createPromo, updatePromo, deletePromo } = usePromos();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promo | null>(null);
  const [page, setPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    description: '',
    type: DiscountType.Percentage,
    value: '' as string | number,
    startDate: '',
    endDate: '',
    appliesTo: 'All' as RateType | 'All',
    isLimitedUses: false,
    maxUses: '' as string | number,
    isActive: true,
  });

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handleOpen = (promo?: Promo) => {
    if (promo) {
      setEditing(promo);
      setForm({
        code: promo.code,
        description: promo.description,
        type: promo.type,
        value: promo.value,
        startDate: promo.startDate ? promo.startDate.split('T')[0] : '',
        endDate: promo.endDate ? promo.endDate.split('T')[0] : '',
        appliesTo: promo.appliesTo || 'All',
        isLimitedUses: promo.maxUses != null,
        maxUses: promo.maxUses != null ? promo.maxUses.toString() : '',
        isActive: promo.isActive,
      });
    } else {
      setEditing(null);
      setForm({
        code: '',
        description: '',
        type: DiscountType.Percentage,
        value: '',
        startDate: '',
        endDate: '',
        appliesTo: 'All',
        isLimitedUses: false,
        maxUses: '',
        isActive: true,
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const data = {
      ...form,
      value: Number(form.value),
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      maxUses: form.isLimitedUses && form.maxUses ? Number(form.maxUses) : undefined,
      appliesTo: form.appliesTo === 'All' ? undefined : form.appliesTo,
    };

    setIsSaving(true);
    try {
      const success = editing
        ? await updatePromo(editing.id, data)
        : await createPromo(data);

      if (success) setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Promos & Discounts</h2>
          <p className="text-muted-foreground mt-1">Manage promotional codes, discounts, and usage limits</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 px-6 shrink-0 shadow-sm transition-all">
          <Plus className="mr-2 h-4 w-4" /> Create Promo
        </Button>
      </div>

      <Dialog open={open} onOpenChange={nextOpen => { if (!isSaving) setOpen(nextOpen); }}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Promo' : 'Create Promo'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the details below.' : 'Create a new discount code.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promo Code *</Label>
              <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER20" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. 20% off for Summer" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <div className="mac-segmented flex w-full rounded-lg p-0.5"><Button type="button" variant={form.type === DiscountType.Percentage ? 'default' : 'ghost'} aria-pressed={form.type === DiscountType.Percentage} className="flex-1 h-8 rounded-md px-3 text-xs font-semibold shadow-none" onClick={() => setForm({...form, type: DiscountType.Percentage})}>%</Button><Button type="button" variant={form.type === DiscountType.FixedAmount ? 'default' : 'ghost'} aria-pressed={form.type === DiscountType.FixedAmount} className="flex-1 h-8 rounded-md px-3 text-xs font-semibold shadow-none" onClick={() => setForm({...form, type: DiscountType.FixedAmount})}>₱</Button></div></div><div className="space-y-2"><Label htmlFor="value">Value *</Label>
                <Input id="value" type="number" step="0.01" min="0" placeholder="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value === '' ? '' : Number(e.target.value) })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <AdminDatePicker value={form.startDate} onChange={(val) => setForm({ ...form, startDate: val })} placeholder="dd/mm/yyyy" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <AdminDatePicker value={form.endDate} onChange={(val) => setForm({ ...form, endDate: val })} placeholder="dd/mm/yyyy" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Applies To</Label><Select value={form.appliesTo} onValueChange={(val: any) => setForm({ ...form, appliesTo: val })}><SelectTrigger><SelectValue placeholder="Select rates" /></SelectTrigger><SelectContent><SelectItem value="All">All Rates</SelectItem><SelectItem value={RateType.Booking}>Booking</SelectItem><SelectItem value={RateType.Training}>Training</SelectItem><SelectItem value={RateType.Internal}>Internal</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Usage Limit</Label><Select value={form.isLimitedUses ? 'Limited' : 'Unlimited'} onValueChange={(val) => setForm({ ...form, isLimitedUses: val === 'Limited', maxUses: val === 'Unlimited' ? '' : form.maxUses })}><SelectTrigger><SelectValue placeholder="Select usage limit" /></SelectTrigger><SelectContent><SelectItem value="Unlimited">Unlimited</SelectItem><SelectItem value="Limited">Limited Uses</SelectItem></SelectContent></Select></div></div>{form.isLimitedUses && (<div className="space-y-2 animate-in fade-in slide-in-from-top-1"><Label htmlFor="maxUses">Maximum Uses *</Label><Input id="maxUses" type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="e.g. 50" required /></div>)}

            {editing && (
              <div className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <Label>Active</Label>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={!form.code.trim() || Number(form.value) <= 0 || isSaving}>
                {isSaving && <LoadingIndicator className="mr-2" label={editing ? 'Saving promo' : 'Creating promo'} />}
                {isSaving ? (editing ? 'Saving changes…' : 'Creating promo…') : (editing ? 'Save changes' : 'Create Promo')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border dark:border-white/10 bg-card text-card-foreground shadow-sm">
        {loading && !promos.length ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>
        ) : promos.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 dark:bg-white/5">
              <Percent className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium">No promos found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">Create a promotional code to offer discounts.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Code</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Discount</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Applies To</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Valid Dates</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Usage</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Validity</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.slice(page * 10, (page + 1) * 10).map((promo) => {
                const validity = getPromoValidity(promo);
                const validityClass = validity === 'Available'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : validity === 'Expired'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    : validity === 'Scheduled'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
                return (
                <TableRow key={promo.id}>
                  <TableCell>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{promo.code}</div>
                      <div className="text-xs text-muted-foreground">{promo.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      {promo.type === DiscountType.Percentage ? `${promo.value}%` : `â‚±${promo.value.toFixed(2)}`}
                    </div>
                  </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 font-medium">
                      {promo.appliesTo ? promo.appliesTo : "All Rates"}
                    </TableCell>
                    <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {promo.startDate || promo.endDate ? (
                        <span>
                          {promo.startDate ? format(new Date(promo.startDate), 'MMM d, yyyy') : 'Anytime'} - {promo.endDate ? format(new Date(promo.endDate), 'MMM d, yyyy') : 'Forever'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Always valid</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{promo.currentUses} {promo.maxUses ? `/ ${promo.maxUses}` : 'used'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${validityClass}`}>
                      {validity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${promo.isActive ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1"><TooltipProvider><Tooltip delayDuration={200}><TooltipTrigger asChild><Button size="icon" variant="ghost" onClick={() => handleOpen(promo)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent className="bg-primary text-primary-foreground font-semibold rounded-lg px-2.5 py-1.5">Edit</TooltipContent></Tooltip></TooltipProvider>{!promo.isActive && <TooltipProvider><Tooltip delayDuration={200}><TooltipTrigger asChild><Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setDeleteTarget(promo)}><Trash className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent className="bg-primary text-primary-foreground font-semibold rounded-lg px-2.5 py-1.5">Delete</TooltipContent></Tooltip></TooltipProvider>}</div>
                  </TableCell>
                </TableRow>
              );})}
            </TableBody>
          </Table>
        )}
      </div>
      <TablePagination page={page} total={promos.length} onPageChange={setPage} />
      <AdminCredentialDeleteDialog open={!!deleteTarget} title={`Delete ${deleteTarget?.code || 'promo'}?`} description="This permanently deletes the disabled promo and cannot be undone." onOpenChange={open => !open && setDeleteTarget(null)} onConfirm={async credentials => { if (deleteTarget && await deletePromo(deleteTarget.id, credentials)) setDeleteTarget(null); }} />
    </div>
  );
}
