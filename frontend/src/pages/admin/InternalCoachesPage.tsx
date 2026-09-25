import { useEffect, useState } from 'react';
import { useInternalCoaches } from '@/hooks/useInternalCoaches';
import { InternalCoachProfile, InternalCoachType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { AdminCredentialDeleteDialog } from '@/components/admin/AdminCredentialDeleteDialog';
import { TABLE_PAGE_SIZE, TablePagination } from '@/components/admin/TablePagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EyeIcon as Eye, FunnelIcon as Filter, MagnifyingGlassIcon as Search, NoSymbolIcon as Disable, PencilIcon as Pencil, PlusIcon as Plus, PowerIcon as Enable, TrashIcon as Trash } from '@heroicons/react/24/solid';
import { toast } from 'sonner';

export default function InternalCoachesPage() {

  const { internalCoaches, loading, fetchInternalCoaches, createInternalCoach, updateInternalCoach, uploadProfileImage, removeProfileImage, deleteInternalCoach } = useInternalCoaches();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InternalCoachProfile | null>(null);
  const [activeTab, setActiveTab] = useState<InternalCoachType>(InternalCoachType.Internal);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(0);
  const [viewing, setViewing] = useState<InternalCoachProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InternalCoachProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    type: InternalCoachType.Internal,
    isActive: true,
    profilePictureUrl: '' as string | undefined,
  });

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    fetchInternalCoaches();
  }, [fetchInternalCoaches]);

  const handleOpen = (profile?: InternalCoachProfile) => {
    setProfileImage(null);
    setRemoveExistingImage(false);
    if (profile) {
      setEditing(profile);
      setForm({
        name: profile.name,
        email: profile.email || '',
        phone: profile.phone || '',
        type: profile.type,
        isActive: profile.isActive,
        profilePictureUrl: profile.profilePictureUrl,
      });
    } else {
      setEditing(null);
      setForm({
        name: '',
        email: '',
        phone: '',
        type: activeTab,
        isActive: true,
        profilePictureUrl: '',
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || isSaving) return;

    const data = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      type: form.type,
    };

    setIsSaving(true);
    try {
      const saved = editing
        ? await updateInternalCoach(editing.id, { ...data, isActive: form.isActive })
        : await createInternalCoach(data);

      if (!saved) return;
      if (profileImage) await uploadProfileImage(saved.id, profileImage);
      else if (editing && removeExistingImage) await removeProfileImage(saved.id);

      // The profile itself already exists at this point. Close the form even if
      // the optional image operation fails so a retry cannot create a duplicate.
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      e.target.value = '';
      toast.error('Choose a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      e.target.value = '';
      toast.error('Profile photo must be 5 MB or smaller');
      return;
    }
    setProfileImage(file);
    setRemoveExistingImage(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(current => ({ ...current, profilePictureUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setProfileImage(null);
    setRemoveExistingImage(Boolean(editing?.profilePictureUrl));
    setForm(current => ({ ...current, profilePictureUrl: undefined }));
  };

  const filteredProfiles = internalCoaches.filter(
    profile => profile.type === activeTab &&
      (statusFilter === 'all' || profile.isActive === (statusFilter === 'active')) &&
      (!search.trim() || `${profile.name} ${profile.email || ''} ${profile.phone || ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const paginatedProfiles = filteredProfiles.slice(page * TABLE_PAGE_SIZE, (page + 1) * TABLE_PAGE_SIZE);
  const typeCount = internalCoaches.filter(profile => profile.type === activeTab).length;
  const limitReached = typeCount >= 20;
  const setProfileStatus = async (profile: InternalCoachProfile) => {
    await updateInternalCoach(profile.id, { name: profile.name, email: profile.email, phone: profile.phone, type: profile.type, isActive: !profile.isActive });
  };

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Internal &amp; Coaches</h2>
          <p className="text-muted-foreground mt-1">Manage internal and coach profiles</p>
        </div>
        <Button onClick={() => handleOpen()} disabled={limitReached} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 px-6 shrink-0 shadow-sm transition-all">
          <Plus className="mr-2 h-4 w-4" /> Add Profile
        </Button>
      </div>

      <Dialog open={open} onOpenChange={nextOpen => { if (!isSaving) setOpen(nextOpen); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Profile' : 'Add Profile'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the details below.' : 'Add a new internal or coach profile.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Picture (Optional)</Label>
              <div className="flex items-center gap-4">
                <label className="group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 dark:bg-slate-800 dark:border-slate-700 transition-all hover:border-primary/50">
                  {form.profilePictureUrl ? (
                    <img src={form.profilePictureUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-semibold text-lg tracking-widest text-slate-400 dark:text-slate-500">
                      {form.name ? getInitials(form.name) : <Plus className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />}
                    </div>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" disabled={isSaving} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Pencil className="h-4 w-4" />
                  </div>
                </label>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Upload photo</span>
                  <span className="text-xs text-muted-foreground mt-0.5">JPEG, PNG or WebP. Max 5 MB.</span>
                  {form.profilePictureUrl && (
                    <button type="button" onClick={removePhoto} className="text-xs text-red-500 hover:text-red-600 hover:underline text-left w-fit mt-1.5 font-medium transition-colors">
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="mac-segmented flex w-full rounded-lg p-0.5">
                <Button type="button" variant="ghost" disabled={isSaving} aria-pressed={form.type === InternalCoachType.Internal} className={`flex-1 h-8 rounded-md px-3 text-xs font-semibold shadow-none ${form.type === InternalCoachType.Internal ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90' : 'text-muted-foreground'}`} onClick={() => setForm({...form, type: InternalCoachType.Internal})}>Internal</Button>
                <Button type="button" variant="ghost" disabled={isSaving} aria-pressed={form.type === InternalCoachType.Coach} className={`flex-1 h-8 rounded-md px-3 text-xs font-semibold shadow-none ${form.type === InternalCoachType.Coach ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90' : 'text-muted-foreground'}`} onClick={() => setForm({...form, type: InternalCoachType.Coach})}>Coach</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" required disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09XX XXX XXXX" disabled={isSaving} />
            </div>
            {editing && (
              <div className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <Label>Active</Label>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={!form.name.trim() || isSaving}>
                {isSaving && <LoadingIndicator className="mr-2" label={editing ? 'Saving profile' : 'Adding profile'} />}
                {isSaving ? (editing ? 'Saving changes…' : 'Adding profile…') : (editing ? 'Save changes' : 'Add profile')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mac-segmented flex w-full lg:w-[400px] rounded-lg p-0.5">
        <Button type="button" variant="ghost" aria-pressed={activeTab === InternalCoachType.Internal} className={`flex-1 h-8 rounded-md px-3 text-xs font-semibold shadow-none ${activeTab === InternalCoachType.Internal ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90' : 'text-muted-foreground'}`} onClick={() => setActiveTab(InternalCoachType.Internal)}>Internal</Button>
        <Button type="button" variant="ghost" aria-pressed={activeTab === InternalCoachType.Coach} className={`flex-1 h-8 rounded-md px-3 text-xs font-semibold shadow-none ${activeTab === InternalCoachType.Coach ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90' : 'text-muted-foreground'}`} onClick={() => setActiveTab(InternalCoachType.Coach)}>Coach</Button>
      </div>
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Filter className="h-4 w-4" /></span><div><p className="font-semibold">Find a profile</p><p className="text-xs text-muted-foreground">Search and filter Internal &amp; Coaches.</p></div></div><span className="text-xs text-muted-foreground">{typeCount}/20 {activeTab === InternalCoachType.Internal ? 'internal' : 'coach'} profiles</span></div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} placeholder="Search name, email, or phone" /></div><Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => { setStatusFilter(value); setPage(0); }}><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
      </div>
        <div className="mt-6 rounded-xl border dark:border-white/10 bg-card text-card-foreground shadow-sm">
          {loading && !internalCoaches.length ? (
            <div className="flex min-h-40 items-center justify-center p-8"><LoadingIndicator label="Loading profiles" /></div>
          ) : filteredProfiles.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 dark:bg-white/5">
                <Plus className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium">No profiles found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">You haven't added any {activeTab === InternalCoachType.Internal ? 'internal' : 'coach'} profiles yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Name</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-100 hidden sm:table-cell">Contact</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border shadow-sm">
                          {profile.profilePictureUrl && <AvatarImage src={profile.profilePictureUrl} alt={profile.name} className="object-cover" />}
                          <AvatarFallback className="bg-primary/5 text-primary font-semibold text-sm tracking-widest">{getInitials(profile.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{profile.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {profile.email && <div>{profile.email}</div>}
                      {profile.phone && <div className="text-muted-foreground text-xs">{profile.phone}</div>}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${profile.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {profile.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1"><Button size="icon" variant="ghost" aria-label="View profile" onClick={() => setViewing(profile)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={profile.isActive ? 'Disable profile' : 'Enable profile'} onClick={() => setProfileStatus(profile)}>{profile.isActive ? <Disable className="h-4 w-4 text-amber-600" /> : <Enable className="h-4 w-4 text-emerald-600" />}</Button>{!profile.isActive && <Button size="icon" variant="ghost" aria-label="Delete profile" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteTarget(profile)}><Trash className="h-4 w-4" /></Button>}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="px-4 pb-4"><TablePagination page={page} total={filteredProfiles.length} onPageChange={setPage} /></div>
      </div>
      <Dialog open={!!viewing} onOpenChange={openState => !openState && setViewing(null)}><DialogContent><DialogHeader><DialogTitle>Profile details</DialogTitle><DialogDescription>View the selected internal or coach profile.</DialogDescription></DialogHeader>{viewing && <div className="space-y-3 rounded-xl border p-4"><p className="text-lg font-semibold">{viewing.name}</p><p className="text-sm text-muted-foreground">{viewing.email || 'No email provided'}</p><p className="text-sm text-muted-foreground">{viewing.phone || 'No phone provided'}</p><p className="text-sm font-medium">{viewing.type} · {viewing.isActive ? 'Active' : 'Inactive'}</p></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setViewing(null)}>Close</Button></DialogFooter></DialogContent></Dialog>
      <AdminCredentialDeleteDialog open={!!deleteTarget} title="Delete inactive profile?" description={`Permanently delete ${deleteTarget?.name || 'this profile'}? This cannot be undone.`} onOpenChange={openState => !openState && setDeleteTarget(null)} onConfirm={async credentials => { if (!deleteTarget) return; const deleted = await deleteInternalCoach(deleteTarget.id, credentials); if (deleted !== false) setDeleteTarget(null); }} />
    </div>
  );
}







