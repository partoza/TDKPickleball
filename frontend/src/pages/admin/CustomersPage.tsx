import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { PlusIcon, MagnifyingGlassIcon, CreditCardIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/solid';
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
  const [issuedUrl, setIssuedUrl] = useState('');
  const [nfcState, setNfcState] = useState('');

  const load = useCallback(async () => {
    try { setLoading(true); setCustomers(await customerService.list(query, includeInactive)); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Customers could not be loaded')); }
    finally { setLoading(false); }
  }, [query, includeInactive]);

  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => setPage(0), [query, includeInactive]);
  const pageItems = useMemo(() => customers.slice(page * 10, page * 10 + 10), [customers, page]);

  const openForm = (customer?: Customer) => {
    setEditing(customer || null);
    setForm(customer ? { fullName: customer.fullName, username: customer.username, email: customer.email, phone: customer.phone || '', adminNotes: customer.adminNotes || '' } : emptyForm);
    setFormOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      editing ? await customerService.update(editing.id, form) : await customerService.create(form);
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

  const issue = async (customer: Customer) => {
    const replacing = customer.hasNfcCard;
    if (replacing && !window.confirm('Replace this NFC card? The old NFC URL will be invalid immediately and permanently.')) return;
    try { const result = await customerService.issue(customer.id, replacing); setIssuedUrl(result.url); setNfcState(''); await load(); }
    catch (error) { toast.error(getApiErrorMessage(error)); }
  };

  const copy = async () => { await navigator.clipboard.writeText(issuedUrl); toast.success('NFC link copied'); };
  const writeNfc = async () => {
    try {
      setNfcState('Hold the NFC card near this device…');
      const NdefWriter = (window as any).NDEFWriter;
      const writer = new NdefWriter();
      await writer.write({ records: [{ recordType: 'url', data: issuedUrl }] });
      setNfcState('NFC card written successfully.');
    } catch (error: any) { setNfcState(error?.name === 'AbortError' ? 'NFC writing was cancelled.' : 'NFC writing failed. Copy the link and use your NFC writer app.'); }
  };

  if (loading && !customers.length) return <AdminPageSkeleton layout="management" label="Loading customers" />;
  return <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-12 sm:px-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-3xl font-bold tracking-tight">Customers</h1><p className="mt-1 text-muted-foreground">Customer profiles, booking history, and single-card NFC membership.</p></div><Button onClick={() => openForm()}><PlusIcon className="mr-2 h-4 w-4" />Add customer</Button></div>
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, username, email, phone, or customer number" aria-label="Search customers" /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} /> Include inactive</label></div>
    <div className="overflow-hidden rounded-xl border bg-card"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Contact</TableHead><TableHead>NFC</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{pageItems.map(customer => <TableRow key={customer.id}><TableCell><div className="font-semibold">{customer.fullName}</div><div className="text-xs text-muted-foreground">@{customer.username} · {customer.customerNumber}</div></TableCell><TableCell><div>{customer.email}</div><div className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</div></TableCell><TableCell><div>{customer.hasNfcCard ? 'Issued' : 'Not issued'}</div><div className="text-xs text-muted-foreground">Last tap: {customer.nfcLastTappedAt ? new Date(customer.nfcLastTappedAt).toLocaleString() : 'Never'}</div></TableCell><TableCell><Badge variant={customer.isActive ? 'default' : 'secondary'}>{customer.isActive ? 'Active' : 'Inactive'}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" aria-label={`View ${customer.fullName}`} onClick={async () => setDetails(await customerService.get(customer.id))}><EyeIcon className="h-4 w-4" /></Button><Button size="sm" variant="ghost" aria-label={`Edit ${customer.fullName}`} onClick={() => openForm(customer)}><PencilIcon className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => issue(customer)}><CreditCardIcon className="mr-1 h-4 w-4" />{customer.hasNfcCard ? 'Replace' : 'Issue'}</Button><Button size="sm" variant={customer.isActive ? 'outline' : 'default'} onClick={() => setActive(customer)}>{customer.isActive ? 'Deactivate' : 'Activate'}</Button></div></TableCell></TableRow>)}</TableBody></Table>{!customers.length && <div className="p-12 text-center text-muted-foreground">No customers match this search.</div>}<TablePagination page={page} total={customers.length} onPageChange={setPage} /></div>

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit customer' : 'Create customer'}</DialogTitle><DialogDescription>Usernames use lowercase letters, numbers, and hyphens.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}><div><Label>Full name</Label><Input required maxLength={150} value={form.fullName} onChange={e => setForm({...form, fullName:e.target.value})} /></div><div><Label>Username</Label><Input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.username} onChange={e => setForm({...form, username:e.target.value.toLowerCase()})} /></div><div><Label>Email</Label><Input required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></div><div><Label>Phone</Label><Input maxLength={30} value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} /></div><div><Label>Admin notes</Label><Textarea maxLength={1000} value={form.adminNotes} onChange={e => setForm({...form, adminNotes:e.target.value})} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button disabled={saving}>{saving ? 'Saving…' : 'Save customer'}</Button></DialogFooter></form></DialogContent></Dialog>

    <Dialog open={!!issuedUrl} onOpenChange={open => !open && setIssuedUrl('')}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>NFC card configuration</DialogTitle><DialogDescription>This complete URL is shown only now. Write it as an NDEF URL/URI record. Reissuing creates a new credential and invalidates the old URL.</DialogDescription></DialogHeader><div className="break-all rounded-lg bg-muted p-3 font-mono text-xs">{issuedUrl}</div><div className="mx-auto rounded-xl bg-white p-4"><QRCode value={issuedUrl || ' '} size={190} /></div>{nfcState && <p role="status" className="text-center text-sm">{nfcState}</p>}<DialogFooter className="sm:justify-center"><Button variant="outline" onClick={copy}>Copy NFC link</Button>{'NDEFWriter' in window && <Button onClick={writeNfc}>Write to NFC card</Button>}</DialogFooter></DialogContent></Dialog>

    <Dialog open={!!details} onOpenChange={open => !open && setDetails(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>{details?.customer.fullName}</DialogTitle><DialogDescription>@{details?.customer.username} · {details?.customer.customerNumber}</DialogDescription></DialogHeader>{details && <Tabs defaultValue="upcoming"><TabsList className="grid grid-cols-4"><TabsTrigger value="upcoming">Upcoming ({details.upcoming.length})</TabsTrigger><TabsTrigger value="pending">Pending ({details.pending.length})</TabsTrigger><TabsTrigger value="past">Past ({details.past.length})</TabsTrigger><TabsTrigger value="cancelled">Cancelled ({details.cancelled.length})</TabsTrigger></TabsList>{(['upcoming','pending','past','cancelled'] as const).map(group => <TabsContent key={group} value={group}><BookingList bookings={details[group]} /></TabsContent>)}</Tabs>}</DialogContent></Dialog>
  </div>;
}

function BookingList({ bookings }: { bookings: Booking[] }) {
  if (!bookings.length) return <div className="p-8 text-center text-muted-foreground">No bookings in this category.</div>;
  return <div className="grid gap-3 sm:grid-cols-2">{bookings.map(booking => <div key={booking.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><strong>{booking.bookingReference}</strong><Badge variant="secondary">{booking.status}</Badge></div><div className="mt-2 text-sm text-muted-foreground">{booking.courtName} · {booking.bookingDate}<br />{booking.startTime.slice(0,5)}–{booking.endTime.slice(0,5)} · {booking.bookingType}<br />Total ₱{booking.totalAmount.toFixed(2)} · Paid ₱{booking.amountPaid.toFixed(2)}{booking.paddleRentalQuantity ? ` · ${booking.paddleRentalQuantity} paddle(s)` : ''}</div></div>)}</div>;
}
