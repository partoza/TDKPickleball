import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { PlusIcon, MagnifyingGlassIcon, CreditCardIcon, PencilIcon, EyeIcon, TrashIcon, ArrowPathIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { customerService, type CustomerInput } from '@/services/customers';
import { getApiErrorMessage } from '@/services/api';
import type { Customer, CustomerDetails } from '@/types';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useRates } from '@/hooks/useRates';
import { RateType, RateValidityUnit } from '@/types';
import { calculateValidThrough, formatAppDate, formatAppDateTime, isDateInCurrentManilaPeriod, manilaTodayIso } from '@/lib/date-time';
import { useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CustomerBookingCarousel } from '@/components/customer/CustomerBookingCarousel';

const emptyForm: CustomerInput = { fullName: '', username: '', email: '', phone: '', adminNotes: '' };

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [includeInactive, setIncludeInactive] = useState(true);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerInput>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [profileImageError, setProfileImageError] = useState('');
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [detailsCustomer, setDetailsCustomer] = useState<Customer | null>(null);
  const [cardCustomer, setCardCustomer] = useState<Customer | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [issuedUrl, setIssuedUrl] = useState('');
  const [customerAction, setCustomerAction] = useState<{ type: 'activate' | 'deactivate' | 'delete' | 'renew'; customer: Customer } | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const notificationsQuery = useNotifications();
  const ratesQuery = useRates();
  const customerCardRate = (ratesQuery.data?.data || []).find(rate => rate.rateType === RateType.CustomerCard && rate.isActive);
  const purchaseStart = manilaTodayIso();
  const purchaseEnd = customerCardRate?.validityDuration && customerCardRate.validityUnit
    ? calculateValidThrough(purchaseStart, customerCardRate.validityDuration, customerCardRate.validityUnit)
    : undefined;

  const load = useCallback(async () => {
    try { setLoading(true); setCustomers(await customerService.list(query, includeInactive)); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Customers could not be loaded')); }
    finally { setLoading(false); }
  }, [query, includeInactive]);

  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => setPage(0), [query, includeInactive]);
  useEffect(() => () => { if (profilePreview.startsWith('blob:')) URL.revokeObjectURL(profilePreview); }, [profilePreview]);
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
    setProfileImage(null);
    setProfilePreview(customer?.profilePictureUrl || '');
    setRemoveProfileImage(false);
    setProfileImageError('');
    setFormOpen(true);
  };

  const chooseProfileImage = (file?: File) => {
    setProfileImageError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setProfileImageError('Use a JPG, PNG, or WebP image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setProfileImageError('The image must be 5 MB or smaller.'); return; }
    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
    setRemoveProfileImage(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      if (editing) {
        let updated = await customerService.update(editing.id, form);
        try {
          if (profileImage) updated = await customerService.uploadProfileImage(editing.id, profileImage);
          else if (removeProfileImage && editing.profilePictureUrl) { await customerService.removeProfileImage(editing.id); updated = { ...updated, profilePictureUrl: undefined }; }
        } catch (error) { toast.error(getApiErrorMessage(error, 'Customer details were saved, but the profile picture could not be updated')); }
        setEditing(updated);
      }
      else {
        const created = await customerService.create(form);
        let customer = created.customer;
        if (profileImage) {
          try { customer = await customerService.uploadProfileImage(created.customer.id, profileImage); }
          catch (error) { toast.error(getApiErrorMessage(error, 'Customer was created, but the profile picture could not be uploaded')); }
        }
        setCardCustomer(customer);
        setIssuedUrl(created.card.url);
      }
      toast.success(editing ? 'Customer updated' : 'Customer created'); setFormOpen(false); await load();
      if (!editing) await queryClient.invalidateQueries({ queryKey: ['admin-revenue'] });
    } catch (error) { toast.error(getApiErrorMessage(error)); }
    finally { setSaving(false); }
  };

  const setActive = async (customer: Customer) => {
    try { await customerService.setActive(customer.id, !customer.isActive); toast.success(customer.isActive ? 'Customer deactivated' : 'Customer reactivated'); await load(); }
    catch (error) { toast.error(getApiErrorMessage(error)); }
  };

  const viewCard = async (customer: Customer) => {
    setCardCustomer(customer); setIssuedUrl(''); setCardLoading(true);
    try { const result = await customerService.getCard(customer.id); setIssuedUrl(result.url); await load(); }
    catch (error) { toast.error(getApiErrorMessage(error)); setCardCustomer(null); }
    finally { setCardLoading(false); }
  };

  const closeCard = () => { if (!cardLoading) { setCardCustomer(null); setIssuedUrl(''); } };

  const deleteCustomer = async (customer: Customer) => {
    if (customer.isActive) return;
    try { await customerService.delete(customer.id); toast.success('Inactive customer deleted'); await load(); }
    catch (error) { toast.error(getApiErrorMessage(error)); }
  };

  const confirmCustomerAction = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (!customerAction) return;
    setActionPending(true);
    try {
      if (customerAction.type === 'delete') await deleteCustomer(customerAction.customer);
      else if (customerAction.type === 'renew') {
        const renewal = await customerService.renew(customerAction.customer.id);
        toast.success(`Customer Card renewed through ${formatAppDate(renewal.validThrough)}`);
        await queryClient.invalidateQueries({ queryKey: ['admin-revenue'] });
        await load();
      }
      else await setActive(customerAction.customer);
      setCustomerAction(null);
    } finally { setActionPending(false); }
  };

  const copyCardLink = async () => {
    try { await navigator.clipboard.writeText(issuedUrl); toast.success('Customer card link copied'); }
    catch { toast.error('Customer card link could not be copied'); }
  };

  if (loading && !customers.length) return <AdminPageSkeleton layout="management" label="Loading customers" />;
  return <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-12 sm:px-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-3xl font-bold tracking-tight">Customers</h1><p className="mt-1 text-muted-foreground">Customer profiles, booking history, and single-card NFC membership.</p></div><Button onClick={() => openForm()}><PlusIcon className="mr-2 h-4 w-4" />Add customer</Button></div>
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, username, email, phone, or customer number" aria-label="Search customers" /></div><div className="inline-flex h-10 items-center gap-2.5 rounded-lg border bg-background px-3 shadow-sm"><Checkbox id="include-inactive-customers" checked={includeInactive} onCheckedChange={setIncludeInactive} /><Label htmlFor="include-inactive-customers" className="cursor-pointer whitespace-nowrap">Include inactive</Label></div></div>
    <div className="overflow-x-auto rounded-xl border bg-card"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Contact</TableHead><TableHead>Customer Card</TableHead><TableHead>Validity</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{pageItems.map(customer => { const cardValid = isDateInCurrentManilaPeriod(customer.cardValidFrom, customer.cardValidThrough); return <TableRow key={customer.id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-10 w-10 border shadow-sm"><AvatarImage src={customer.profilePictureUrl} alt={customer.fullName} className="object-cover" /><AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials(customer.fullName)}</AvatarFallback></Avatar><div><div className="font-semibold">{customer.fullName}</div><div className="text-xs text-muted-foreground">@{customer.username} · {customer.customerNumber}</div></div></div></TableCell><TableCell><div>{customer.email}</div><div className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</div></TableCell><TableCell><div>{customer.hasNfcCard ? 'Issued' : 'Creating…'}</div><div className="text-xs text-muted-foreground">Last tap: {customer.nfcLastTappedAt ? formatAppDateTime(customer.nfcLastTappedAt) : 'Never'}</div></TableCell><TableCell><div className="whitespace-nowrap text-sm">{formatAppDate(customer.cardValidFrom)} – {formatAppDate(customer.cardValidThrough)}</div></TableCell><TableCell><Badge variant={customer.isActive && cardValid ? 'default' : 'secondary'}>{!customer.isActive ? 'Inactive' : cardValid ? 'Active' : 'Expired'}</Badge></TableCell><TableCell><div className="flex flex-wrap justify-end gap-1"><Button size="sm" variant="ghost" aria-label={`View ${customer.fullName}`} onClick={() => { setDetails(null); setDetailsCustomer(customer); }}><EyeIcon className="h-4 w-4" /></Button><Button size="sm" variant="ghost" aria-label={`Edit ${customer.fullName}`} onClick={() => openForm(customer)}><PencilIcon className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => viewCard(customer)}><CreditCardIcon className="mr-1 h-4 w-4" />View Card</Button><Button size="sm" variant="outline" onClick={() => setCustomerAction({ type: 'renew', customer })}><ArrowPathIcon className="mr-1 h-4 w-4" />Renew</Button><Button size="sm" variant={customer.isActive ? 'outline' : 'default'} onClick={() => setCustomerAction({ type: customer.isActive ? 'deactivate' : 'activate', customer })}>{customer.isActive ? 'Deactivate' : 'Activate'}</Button>{!customer.isActive && <Button size="sm" variant="destructive" aria-label={`Delete ${customer.fullName}`} onClick={() => setCustomerAction({ type: 'delete', customer })}><TrashIcon className="h-4 w-4" /></Button>}</div></TableCell></TableRow>; })}</TableBody></Table>{!customers.length && <div className="p-12 text-center text-muted-foreground">No customers match this search.</div>}<TablePagination page={page} total={customers.length} onPageChange={setPage} /></div>

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-lg"><DialogHeader className="border-b px-6 py-5"><DialogTitle>{editing ? 'Edit customer' : 'Create customer'}</DialogTitle><DialogDescription>{editing ? 'Update the customer profile.' : 'Creating a customer purchases and issues a Customer Card automatically.'}</DialogDescription></DialogHeader><form className="min-h-0 flex-1 overflow-y-auto" onSubmit={submit}><div className="space-y-4 px-6 py-5"><div className="rounded-xl border bg-muted/20 p-4"><div className="flex items-center gap-4"><Avatar className="h-20 w-20 border-2 border-background shadow"><AvatarImage src={profilePreview} alt="Customer profile preview" className="object-cover" /><AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">{initials(form.fullName)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><Label htmlFor="customer-profile-image">Profile picture</Label><p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WebP up to 5 MB.</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" asChild><label htmlFor="customer-profile-image" className="cursor-pointer"><PhotoIcon className="mr-1.5 h-4 w-4" />Choose image</label></Button>{profilePreview && <Button type="button" size="sm" variant="ghost" onClick={() => { setProfileImage(null); setProfilePreview(''); setRemoveProfileImage(true); setProfileImageError(''); }}><XMarkIcon className="mr-1 h-4 w-4" />Remove</Button>}</div><input id="customer-profile-image" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => { chooseProfileImage(event.target.files?.[0]); event.currentTarget.value = ''; }} /></div></div>{profileImageError && <p className="mt-2 text-xs font-medium text-destructive">{profileImageError}</p>}</div><div><Label>Full name</Label><Input required maxLength={150} placeholder="e.g. Juan Dela Cruz" value={form.fullName} onChange={e => setForm({...form, fullName:e.target.value})} /></div><div><Label>Username</Label><Input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="e.g. juan-dela-cruz" value={form.username} onChange={e => setForm({...form, username:e.target.value.toLowerCase()})} /></div><div><Label>Email</Label><Input required type="email" placeholder="e.g. juan@example.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></div><div><Label>Phone</Label><Input maxLength={30} placeholder="e.g. 09123456789" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} /></div><div><Label>Admin notes</Label><Textarea maxLength={1000} placeholder="Optional notes visible only to admins" value={form.adminNotes} onChange={e => setForm({...form, adminNotes:e.target.value})} /></div>{!editing && (customerCardRate && purchaseEnd ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-bold">Customer Card purchase</p><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><span className="text-muted-foreground">Price</span><p className="font-semibold">₱{customerCardRate.pricePerHour.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div><div><span className="text-muted-foreground">Plan</span><p className="font-semibold">{customerCardRate.validityDuration} {(customerCardRate.validityUnit || RateValidityUnit.Month).toLowerCase()}{customerCardRate.validityDuration === 1 ? '' : 's'}</p></div><div><span className="text-muted-foreground">Valid from</span><p className="font-semibold">{formatAppDate(purchaseStart)}</p></div><div><span className="text-muted-foreground">Valid through</span><p className="font-semibold">{formatAppDate(purchaseEnd)}</p></div></div></div> : <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">Configure and activate a Customer Card rate before adding a customer.</div>)}</div><DialogFooter className="sticky bottom-0 border-t bg-background px-6 py-4"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button disabled={saving || !!profileImageError || (!editing && !customerCardRate)}>{saving ? 'Saving…' : editing ? 'Save customer' : 'Purchase & create customer'}</Button></DialogFooter></form></DialogContent></Dialog>

    <Dialog open={!!cardCustomer} onOpenChange={open => { if (!open) closeCard(); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Customer NFC card</DialogTitle><DialogDescription>{cardLoading ? `Loading ${cardCustomer?.fullName}'s card…` : `Valid ${formatAppDate(cardCustomer?.cardValidFrom)} through ${formatAppDate(cardCustomer?.cardValidThrough)}.`}</DialogDescription></DialogHeader>{cardLoading ? <div className="flex flex-col items-center gap-4 py-3"><Skeleton className="h-[252px] w-[252px] rounded-xl" /><Skeleton className="h-14 w-full rounded-lg" /></div> : <><div className="flex justify-center"><div className="w-fit rounded-xl bg-white p-4"><QRCode value={issuedUrl || ' '} size={220} /></div></div><a href={issuedUrl} target="_blank" rel="noopener noreferrer" className="block break-all rounded-lg border bg-muted/50 p-3 text-center text-xs font-medium text-primary underline-offset-4 hover:underline">{issuedUrl}</a></>}<DialogFooter><Button className="w-full" disabled={cardLoading || !issuedUrl} onClick={copyCardLink}>Copy Link</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={!!detailsCustomer} onOpenChange={open => { if (!open) { setDetailsCustomer(null); setDetails(null); } }}><DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-4xl"><DialogHeader className="shrink-0 border-b px-6 py-5"><div className="flex items-center gap-3 pr-8"><Avatar className="h-12 w-12 border shadow-sm"><AvatarImage src={detailsCustomer?.profilePictureUrl} alt={detailsCustomer?.fullName} className="object-cover" /><AvatarFallback className="bg-primary/10 font-bold text-primary">{initials(detailsCustomer?.fullName || '')}</AvatarFallback></Avatar><div className="min-w-0"><DialogTitle className="truncate">{detailsCustomer?.fullName}</DialogTitle><DialogDescription className="mt-1">@{detailsCustomer?.username} · {detailsCustomer?.customerNumber}<span className="hidden sm:inline"> · </span><span className="block sm:inline">Customer Card: {formatAppDate(detailsCustomer?.cardValidFrom)} – {formatAppDate(detailsCustomer?.cardValidThrough)}</span></DialogDescription></div></div></DialogHeader><div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">{details ? <Tabs defaultValue="upcoming"><TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1 sm:grid-cols-4">{(['upcoming','pending','past','cancelled'] as const).map(group => <TabsTrigger key={group} value={group} className="min-h-10 rounded-lg text-xs capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-sm">{group} ({details[group].length})</TabsTrigger>)}</TabsList>{(['upcoming','pending','past','cancelled'] as const).map(group => <TabsContent key={group} value={group} className="mt-4"><CustomerBookingCarousel bookings={details[group]} emptyMessage="No bookings in this category." ariaLabel={`${group} customer bookings`} /></TabsContent>)}</Tabs> : <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-48 w-full" /></div>}</div><DialogFooter className="shrink-0 border-t bg-muted/20 px-6 py-4"><Button variant="outline" onClick={() => { setDetailsCustomer(null); setDetails(null); }}>Close</Button></DialogFooter></DialogContent></Dialog>

    <AlertDialog open={!!customerAction} onOpenChange={open => { if (!open && !actionPending) setCustomerAction(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{customerAction?.type === 'delete' ? 'Delete inactive customer?' : customerAction?.type === 'deactivate' ? 'Deactivate customer?' : customerAction?.type === 'renew' ? 'Renew Customer Card?' : 'Reactivate customer?'}</AlertDialogTitle><AlertDialogDescription>{customerAction?.type === 'delete' ? `${customerAction.customer.fullName} will be removed from the customer list. Their historical booking snapshots will remain unchanged.` : customerAction?.type === 'deactivate' ? `${customerAction.customer.fullName}'s NFC card and Customer Card promos will stop working immediately.` : customerAction?.type === 'renew' ? customerCardRate ? `Charge ₱${customerCardRate.pricePerHour.toLocaleString(undefined, { minimumFractionDigits: 2 })} and extend ${customerAction.customer.fullName}'s card by ${customerCardRate.validityDuration} ${(customerCardRate.validityUnit || RateValidityUnit.Month).toLowerCase()}${customerCardRate.validityDuration === 1 ? '' : 's'}. This sale will be added to Revenue and an email will be sent.` : 'Configure an active Customer Card rate before renewing.' : `${customerAction?.customer.fullName}'s existing NFC card will work again if its validity has not expired.`}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={actionPending}>Cancel</AlertDialogCancel><AlertDialogAction className={customerAction?.type === 'delete' || customerAction?.type === 'deactivate' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''} disabled={actionPending || (customerAction?.type === 'renew' && !customerCardRate)} onClick={confirmCustomerAction}>{actionPending ? 'Please wait…' : customerAction?.type === 'delete' ? 'Delete customer' : customerAction?.type === 'deactivate' ? 'Deactivate' : customerAction?.type === 'renew' ? 'Confirm renewal' : 'Reactivate'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'CU';
}
