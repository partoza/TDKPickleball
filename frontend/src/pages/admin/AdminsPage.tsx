import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EnvelopeIcon, NoSymbolIcon, PhotoIcon, PlusIcon, PowerIcon, TrashIcon } from '@heroicons/react/24/solid';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { toast } from 'sonner';
import { authService } from '@/services/auth';
import { getApiErrorMessage } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { SystemUser } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminCredentialDeleteDialog } from '@/components/admin/AdminCredentialDeleteDialog';
import { TablePagination } from '@/components/admin/TablePagination';

const empty = { firstName: '', lastName: '', email: '', role: 'Staff' };
const maximumTeamAccounts = 10;
const maximumImageBytes = 5 * 1024 * 1024;

export default function AdminsPage() {
  const client = useQueryClient();
  const { user: currentUser } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['system-users'], queryFn: authService.getUsers });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [page, setPage] = useState(0);

  const create = useMutation({
    mutationFn: async ({ image, ...details }: typeof empty & { image: File | null }) => {
      const created = await authService.createUser(details);
      if (!created.success || !created.data || !image) return { user: created, imageError: '' };
      try {
        return { user: await authService.uploadUserProfileImage(created.data.id, image), imageError: '' };
      } catch (error) {
        return { user: created, imageError: getApiErrorMessage(error, 'The account was created, but its profile image could not be uploaded') };
      }
    },
    onSuccess: ({ user, imageError }) => {
      if (!user.success) return toast.error(user.message);
      client.invalidateQueries({ queryKey: ['system-users'] });
      closeDialog();
      if (imageError) toast.warning(imageError);
      else toast.success('User added and invitation sent');
    },
    onError: error => toast.error(getApiErrorMessage(error, 'User could not be added')),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => authService.setUserActive(id, isActive),
    onSuccess: response => {
      if (!response.success) return toast.error(response.message);
      client.invalidateQueries({ queryKey: ['system-users'] });
      toast.success(response.message || 'User status updated');
    },
    onError: error => toast.error(getApiErrorMessage(error, 'User status could not be updated')),
  });

  const remove = useMutation({
    mutationFn: authService.deleteUser,
    onSuccess: response => {
      if (!response.success) return toast.error(response.message);
      client.invalidateQueries({ queryKey: ['system-users'] });
      toast.success('Inactive user deleted');
      setDeleteTarget(null);
    },
    onError: error => toast.error(getApiErrorMessage(error, 'Inactive user could not be deleted')),
  });

  const users = data?.data || [];
  const limitReached = users.length >= maximumTeamAccounts;

  const openDialog = () => {
    setForm(empty);
    setProfileImage(null);
    setImagePreview('');
    setErrors({});
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setForm(empty);
    setProfileImage(null);
    setImagePreview('');
    setErrors({});
  };

  const chooseImage = (file?: File) => {
    if (!file) {
      setProfileImage(null);
      setImagePreview('');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors(current => ({ ...current, profileImage: 'Choose a JPEG, PNG, or WebP image.' }));
      return;
    }
    if (file.size > maximumImageBytes) {
      setErrors(current => ({ ...current, profileImage: 'Profile images must be 5 MB or smaller.' }));
      return;
    }
    setProfileImage(file);
    setErrors(current => ({ ...current, profileImage: '' }));
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const save = () => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.';
    setErrors(next);
    if (!Object.keys(next).length) create.mutate({ ...form, image: profileImage });
  };

  return <div className="space-y-6 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-3xl font-bold tracking-tight">User management</h1><p className="mt-1 text-muted-foreground">Create administrator and staff access with secure first-login setup.</p></div>
      <Button onClick={openDialog} disabled={limitReached}><PlusIcon className="h-4 w-4" />Add User</Button>
    </div>

    <Card className="rounded-2xl">
      <CardHeader><CardTitle>Team accounts</CardTitle><CardDescription>{users.length}/{maximumTeamAccounts} accounts used. Up to 10 administrator and staff accounts are allowed.</CardDescription></CardHeader>
      <CardContent>{isLoading ? <div className="space-y-3">{[1, 2].map(x => <Skeleton key={x} className="h-16 rounded-xl" />)}</div> : <div className="space-y-4"><div className="overflow-x-auto rounded-xl border dark:border-white/10"><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{users.slice(page * 10, (page + 1) * 10).map(user => <TableRow key={user.id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-10 w-10 border"><AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} /><AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials(user.firstName, user.lastName)}</AvatarFallback></Avatar><div><p className="font-semibold">{user.firstName} {user.lastName}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><EnvelopeIcon className="h-3.5 w-3.5" />{user.email}</p></div></div></TableCell><TableCell><Badge variant="outline">{user.role}</Badge>{user.mustChangePassword && <Badge className="ml-2 bg-amber-500 text-white">Invitation pending</Badge>}</TableCell><TableCell><Badge variant={user.isActive ? 'default' : 'secondary'}>{user.isActive ? 'Active' : 'Inactive'}</Badge></TableCell><TableCell><div className="flex justify-end gap-2">{currentUser?.email !== user.email && <Button size="sm" variant="outline" disabled={setStatus.isPending || remove.isPending} className={user.isActive ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'} onClick={() => setStatus.mutate({ id: user.id, isActive: !user.isActive })}>{user.isActive ? <NoSymbolIcon className="h-4 w-4" /> : <PowerIcon className="h-4 w-4" />}{user.isActive ? 'Disable' : 'Enable'}</Button>}{!user.isActive && currentUser?.email !== user.email && <Button size="sm" variant="outline" disabled={setStatus.isPending || remove.isPending} className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(user)}><TrashIcon className="h-4 w-4" />Delete</Button>}{currentUser?.email === user.email && <Badge variant="outline">Current account</Badge>}</div></TableCell></TableRow>)}</TableBody></Table></div><TablePagination page={page} total={users.length} onPageChange={setPage} /></div>}
      </CardContent>
    </Card>

    <Dialog open={open} onOpenChange={value => value ? setOpen(true) : closeDialog()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add team member</DialogTitle><DialogDescription>A temporary password will be generated and sent to their email. SMTP must be configured.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center gap-4 rounded-xl border dark:border-white/10 p-3">
            <Avatar className="h-16 w-16 border"><AvatarImage src={imagePreview} alt="Selected profile" /><AvatarFallback><PhotoIcon className="h-6 w-6 text-muted-foreground" /></AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><Label htmlFor="profile-image">Profile picture</Label><Input id="profile-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => chooseImage(event.target.files?.[0])} /><p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, or WebP · maximum 5 MB</p>{errors.profileImage && <p className="field-error">{errors.profileImage}</p>}</div>
          </div>
          <Field label="First name" placeholder="e.g. Juan" value={form.firstName} error={errors.firstName} onChange={value => setForm({ ...form, firstName: value })} />
          <Field label="Last name" placeholder="e.g. Dela Cruz" value={form.lastName} error={errors.lastName} onChange={value => setForm({ ...form, lastName: value })} />
          <div className="sm:col-span-2"><Field label="Email" placeholder="e.g. juan@example.com" type="email" value={form.email} error={errors.email} onChange={value => setForm({ ...form, email: value })} /></div>
          <div className="sm:col-span-2"><Label>Role</Label><Select value={form.role} onValueChange={role => setForm({ ...form, role })}><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger><SelectContent><SelectItem value="Staff">Staff</SelectItem><SelectItem value="Admin">Admin</SelectItem></SelectContent></Select></div>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={save} disabled={create.isPending}>Send Invitation{create.isPending && <LoadingIndicator label="Sending invitation" />}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <AdminCredentialDeleteDialog open={!!deleteTarget} title={`Delete ${deleteTarget?.firstName || 'user'} ${deleteTarget?.lastName || ''}?`} description="This permanently removes the inactive user and their Cloudinary profile image. This cannot be undone." pending={remove.isPending} onOpenChange={open => !open && setDeleteTarget(null)} onConfirm={credentials => { if (deleteTarget) remove.mutate({ userId: deleteTarget.id, credentials }); }} />
  </div>;
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

function Field({ label, placeholder, value, error, type = 'text', onChange }: { label: string; placeholder: string; value: string; error?: string; type?: string; onChange: (value: string) => void }) {
  return <div><Label>{label} *</Label><Input type={type} value={value} placeholder={placeholder} aria-invalid={!!error} onChange={event => onChange(event.target.value)} />{error && <p className="field-error">{error}</p>}</div>;
}

