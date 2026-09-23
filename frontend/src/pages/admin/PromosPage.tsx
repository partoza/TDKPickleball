import React, { useEffect, useState } from 'react';
import { usePromos } from '@/hooks/usePromos';
import { Promo, DiscountType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusIcon as Plus, EllipsisHorizontalIcon as MoreHorizontal, ReceiptPercentIcon as Percent, CalendarDaysIcon as Calendar, UsersIcon as Users } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

export default function PromosPage() {
  const { promos, loading, fetchPromos, createPromo, updatePromo, deletePromo } = usePromos();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promo | null>(null);

  const [form, setForm] = useState({
    code: '',
    description: '',
    type: DiscountType.Percentage,
    value: 0,
    startDate: '',
    endDate: '',
    maxUses: '',
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
        maxUses: promo.maxUses?.toString() || '',
        isActive: promo.isActive,
      });
    } else {
      setEditing(null);
      setForm({
        code: '',
        description: '',
        type: DiscountType.Percentage,
        value: 0,
        startDate: '',
        endDate: '',
        maxUses: '',
        isActive: true,
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      value: Number(form.value),
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
    };

    const success = editing 
      ? await updatePromo(editing.id, data)
      : await createPromo(data);

    if (success) {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Promos & Discounts</h2>
          <p className="text-muted-foreground mt-1">Manage promotional codes, discounts, and usage limits</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 px-6 shrink-0 shadow-sm transition-all">
          <Plus className="mr-2 h-4 w-4" /> Create Promo
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
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
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button type="button" className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${form.type === DiscountType.Percentage ? 'bg-white dark:bg-slate-950 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`} onClick={() => setForm({...form, type: DiscountType.Percentage})}>%</button>
                  <button type="button" className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${form.type === DiscountType.FixedAmount ? 'bg-white dark:bg-slate-950 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`} onClick={() => setForm({...form, type: DiscountType.FixedAmount})}>₱</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value *</Label>
                <Input id="value" type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUses">Max Uses (Optional)</Label>
              <Input id="maxUses" type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="e.g. 50" />
            </div>

            {editing && (
              <div className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <Label>Active</Label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!form.code.trim() || form.value <= 0}>{editing ? 'Save changes' : 'Create Promo'}</Button>
            </div>
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
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Valid Dates</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Usage</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{promo.code}</div>
                      <div className="text-xs text-muted-foreground">{promo.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      {promo.type === DiscountType.Percentage ? `${promo.value}%` : `₱${promo.value.toFixed(2)}`}
                    </div>
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
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${promo.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={() => handleOpen(promo)} className="cursor-pointer">Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { if(window.confirm('Delete this promo?')) deletePromo(promo.id); }} className="cursor-pointer text-red-600 focus:text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
