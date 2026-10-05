import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { PlusIcon, MagnifyingGlassIcon, CreditCardIcon, PencilIcon, EyeIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/solid';
import { customerService, type CustomerInput } from '@/services/customers';
import { getApiErrorMessage } from '@/services/api';
import type { Booking, Customer, CustomerDetails } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { TablePagination } from '@/components/admin/TablePagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/useNotifications';

const emptyForm: CustomerInput = { fullName: '', username: '', email: '', phone: '', adminNotes: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [includeInactive, setIncludeInactive] = useState(true);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerInput>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [detailsCustomer, setDetailsCustomer] = useState<Customer | null>(null);
  const [issuedUrl, setIssuedUrl] = useState('');
  const notificationsQuery = useNotifications();

  const load = useCallback(async () => {
    try { setLoading(true); setCustomers(await customerService.list(query, includeInactive)); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Customers could not be loaded')); }
    finally { setLoading(false); }
  }, [query, includeInactive]);

  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => setPage(0), [query, includeInactive]);
  const pageItems = useMemo(() => customers.slice(page * 10, page * 10 + 10), [customers, page]);

  const loadDetails = useCallback(async (customerId: number) => {
    try { setDetails(await customerService.get(customerId)); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Customer details could not be loaded')); setDetailsCustomer(null); }
  }, []);

  useEffect(() => {
    if (detailsCustomer) void loadDetails(detailsCustomer.id);
  }, [detailsCustomer?.id, notificationsQuery.dataUpdatedAt, loadDetails]);

  const openForm = (customer?: Customer) => {
    setEditing(customer || null);
    setForm(customer ? { fullName: customer.fullName, username: customer.username, email: customer.email, phone: customer.phone || '', adminNotes: customer.adminNotes || '' } : emptyForm);
    setFormOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      if (editing) await customerService.update(editing.id, form);
      else {
        const created = await customerService.create(form);
        setIssuedUrl(created.card.url);
      }
      toast.success(editing ? 'Customer updated' : 'Customer created'); setFormOpen(false); await load();
    } catch (error) { toast.error(getApiErrorMessage(error)); }
    finally { setSaving(false); }
  };

  const setActive = async (customer: Customer) => {
    if (!customer.isActive && !window.confirm(`Reactivate ${customer.fullName}? Their existing NFC card will work again.`)) return;
    if (customer.isActive && !window.confirm(`Deactivate ${customer.fullName}? Their NFC card and customer-only promos will stop working.`)) return;
    try { await customerService.setActive(customer.id, !customer.isActive); toast.success(customer.isActive ? 'Customer deactivated' : 'Customer reactivated'); await load(); }
    catch (error) { toast.error(getApiErrorMessage(error)); }
  };

  const viewCard = async (customer: Customer) => {
    try { const result = await customerService.getCard(customer.id); setIssuedUrl(result.url); await load(); }
    catch (error) { toast.error(getApiErrorMessage(error)); }
  };

  const deleteCustomer = async (customer: Customer) => {
    if (customer.isActive || !window.confirm(`Delete inactive customer ${customer.fullName}? Their historical bookings will remain unchanged.`)) return;
    try { await customerService.delete(customer.id); toast.success('Inactive customer deleted'); await load(); }
    catch (error) { toast.error(getApiErrorMessage(error)); }
  };

  if (loading && !customers.length) return <AdminPageSkeleton layout="management" label="Loading customers" />;
  return <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-12 sm:px-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-3xl font-bold tracking-tight">Customers</h1><p className="mt-1 text-muted-foreground">Customer profiles, booking history, and single-card NFC membership.</p></div><Button onClick={() => openForm()}><PlusIcon className="mr-2 h-4 w-4" />Add customer</Button></div>
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, username, email, phone, or customer number" aria-label="Search customers" /></div><button type="button" role="checkbox" aria-checked={includeInactive} onClick={() => setIncludeInactive(value => !value)} className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent"><span className={`grid h-4 w-4 place-items-center rounded border ${includeInactive ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'}`}>{includeInactive && <CheckIcon className="h-3 w-3" />}</span>Include inactive</button></div>
    <div className="overflow-hidden rounded-xl border bg-card"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Contact</TableHead><TableHead>NFC</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{pageItems.map(customer => <TableRow key={customer.id}><TableCell><div className="font-semibold">{customer.fullName}</div><div className="text-xs text-muted-foreground">@{customer.username} · {customer.customerNumber}</div></TableCell><TableCell><div>{customer.email}</div><div className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</div></TableCell><TableCell><div>{customer.hasNfcCard ? 'Issued' : 'Creating…'}</div><div className="text-xs text-muted-foreground">Last tap: {customer.nfcLastTappedAt ? new Date(customer.nfcLastTappedAt).toLocaleString() : 'Never'}</div></TableCell><TableCell><Badge variant={customer.isActive ? 'default' : 'secondary'}>{customer.isActive ? 'Active' : 'Inactive'}</Badge></TableCell><TableCell><div className="flex flex-wrap justify-end gap-1"><Button size="sm" variant="ghost" aria-label={`View ${customer.fullName}`} onClick={() => { setDetails(null); setDetailsCustomer(customer); }}><EyeIcon className="h-4 w-4" /></Button><Button size="sm" variant="ghost" aria-label={`Edit ${customer.fullName}`} onClick={() => openForm(customer)}><PencilIcon className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => viewCard(customer)}><CreditCardIcon className="mr-1 h-4 w-4" />View Card</Button><Button size="sm" variant={customer.isActive ? 'outline' : 'default'} onClick={() => setActive(customer)}>{customer.isActive ? 'Deactivate' : 'Activate'}</Button>{!customer.isActive && <Button size="sm" variant="destructive" aria-label={`Delete ${customer.fullName}`} onClick={() => deleteCustomer(customer)}><TrashIcon className="h-4 w-4" /></Button>}</div></TableCell></TableRow>)}</TableBody></Table>{!customers.length && <div className="p-12 text-center text-muted-foreground">No customers match this search.</div>}<TablePagination page={page} total={customers.length} onPageChange={setPage} /></div>

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit customer' : 'Create customer'}</DialogTitle><DialogDescription>Usernames use lowercase letters, numbers, and hyphens.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}><div><Label>Full name</Label><Input required maxLength={150} placeholder="e.g. Juan Dela Cruz" value={form.fullName} onChange={e => setForm({...form, fullName:e.target.value})} /></div><div><Label>Username</Label><Input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="e.g. juan-dela-cruz" value={form.username} onChange={e => setForm({...form, username:e.target.value.toLowerCase()})} /></div><div><Label>Email</Label><Input required type="email" placeholder="e.g. juan@example.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></div><div><Label>Phone</Label><Input maxLength={30} placeholder="e.g. 09123456789" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} /></div><div><Label>Admin notes</Label><Textarea maxLength={1000} placeholder="Optional notes visible only to admins" value={form.adminNotes} onChange={e => setForm({...form, adminNotes:e.target.value})} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button disabled={saving}>{saving ? 'Saving…' : 'Save customer'}</Button></DialogFooter></form></DialogContent></Dialog>

    <Dialog open={!!issuedUrl} onOpenChange={open => !open && setIssuedUrl('')}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Customer NFC card</DialogTitle><DialogDescription>Scan this QR code to open the customer's public card.</DialogDescription></DialogHeader><div className="mx-auto rounded-xl bg-white p-4"><QRCode value={issuedUrl || ' '} size={220} /></div><DialogFooter><Button className="w-full" onClick={() => setIssuedUrl('')}>Close</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={!!detailsCustomer} onOpenChange={open => { if (!open) { setDetailsCustomer(null); setDetails(null); } }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>{detailsCustomer?.fullName}</DialogTitle><DialogDescription>@{detailsCustomer?.username} · {detailsCustomer?.customerNumber}</DialogDescription></DialogHeader>{details ? <Tabs defaultValue="upcoming"><TabsList className="grid grid-cols-4"><TabsTrigger value="upcoming">Upcoming ({details.upcoming.length})</TabsTrigger><TabsTrigger value="pending">Pending ({details.pending.length})</TabsTrigger><TabsTrigger value="past">Past ({details.past.length})</TabsTrigger><TabsTrigger value="cancelled">Cancelled ({details.cancelled.length})</TabsTrigger></TabsList>{(['upcoming','pending','past','cancelled'] as const).map(group => <TabsContent key={group} value={group}><BookingList bookings={details[group]} /></TabsContent>)}</Tabs> : <div className="space-y-3 py-4"><Skeleton className="h-9 w-full" /><Skeleton className="h-28 w-full" /></div>}</DialogContent></Dialog>
  </div>;
}

function BookingList({ bookings }: { bookings: Booking[] }) {
  if (!bookings.length) return <div className="p-8 text-center text-muted-foreground">No bookings in this category.</div>;
  return <div className="grid gap-3 sm:grid-cols-2">{bookings.map(booking => <div key={booking.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><strong>{booking.bookingReference}</strong><Badge variant="secondary">{booking.status}</Badge></div><div className="mt-2 text-sm text-muted-foreground">{booking.courtName} · {booking.bookingDate}<br />{booking.startTime.slice(0,5)}–{booking.endTime.slice(0,5)} · {booking.bookingType}<br />Total ₱{booking.totalAmount.toFixed(2)} · Paid ₱{booking.amountPaid.toFixed(2)}{booking.paddleRentalQuantity ? ` · ${booking.paddleRentalQuantity} paddle(s)` : ''}</div></div>)}</div>;
}
