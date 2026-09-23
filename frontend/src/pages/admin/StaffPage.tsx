import { useEffect, useState } from 'react';
import { useStaff } from '@/hooks/useStaff';
import { StaffProfile, StaffType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EllipsisHorizontalIcon as MoreHorizontal, PencilIcon as Pencil, PlusIcon as Plus, TrashIcon as Trash } from '@heroicons/react/24/solid';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function StaffPage() {

  const { staff, loading, fetchStaff, createStaff, updateStaff, deleteStaff } = useStaff();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Internal');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    type: StaffType.Internal,
    isActive: true,
    profilePictureUrl: '' as string | undefined,
  });

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleOpen = (profile?: StaffProfile) => {
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
        type: activeTab === 'Internal' ? StaffType.Internal : StaffType.Trainer,
        isActive: true,
        profilePictureUrl: '',
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const data = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      type: form.type,
      isActive: form.isActive,
    };

    const success = editing
      ? await updateStaff(editing.id, data)
      : await createStaff(data);

    if (success) {
      setOpen(false);
    }
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 128, 128);
          setForm({ ...form, profilePictureUrl: canvas.toDataURL('image/jpeg', 0.8) });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      await deleteStaff(id);
    }
  };

  const filteredStaff = staff.filter(
    (s) => s.type === (activeTab === 'Internal' ? StaffType.Internal : StaffType.Trainer)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Internal & Trainer</h2>
          <p className="text-muted-foreground mt-1">Manage internal and trainer profiles</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 px-6 shrink-0 shadow-sm transition-all">
          <Plus className="mr-2 h-4 w-4" /> Add Profile
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Profile' : 'Add Profile'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the details below.' : 'Add a new internal or trainer profile.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Picture (Optional)</Label>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-slate-800 dark:border-slate-700">
                      {form.profilePictureUrl ? (
                        <img src={form.profilePictureUrl} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-semibold text-lg tracking-widest text-slate-400 dark:text-slate-500">
                          {form.name ? getInitials(form.name) : <Plus className="h-6 w-6" />}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Pencil className="h-4 w-4" />
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <label className="cursor-pointer flex items-center w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Picture
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    </DropdownMenuItem>
                    {form.profilePictureUrl && (
                      <DropdownMenuItem onClick={() => setForm({ ...form, profilePictureUrl: undefined })} className="text-red-600 focus:text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Remove Picture
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="text-xs text-muted-foreground">
                  <p>Recommended size: 256x256px.</p>
                  <p>JPG or PNG under 2MB.</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="mac-segmented flex w-full rounded-lg p-0.5">
                <Button type="button" variant="ghost" className={`flex-1 h-8 rounded-md px-3 text-xs font-semibold shadow-none ${form.type === StaffType.Internal ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => setForm({...form, type: StaffType.Internal})}>Internal</Button>
                <Button type="button" variant="ghost" className={`flex-1 h-8 rounded-md px-3 text-xs font-semibold shadow-none ${form.type === StaffType.Trainer ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => setForm({...form, type: StaffType.Trainer})}>Trainer</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            {editing && (
              <div className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <Label>Active</Label>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!form.name.trim()}>{editing ? 'Save changes' : 'Add profile'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mac-segmented flex w-full lg:w-[400px] rounded-lg p-0.5">
        <Button type="button" variant="ghost" className={`flex-1 h-8 rounded-md px-3 text-xs font-semibold shadow-none ${activeTab === 'Internal' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => setActiveTab('Internal')}>Internal</Button>
        <Button type="button" variant="ghost" className={`flex-1 h-8 rounded-md px-3 text-xs font-semibold shadow-none ${activeTab === 'Trainer' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => setActiveTab('Trainer')}>Trainer</Button>
      </div>
        <div className="mt-6 rounded-xl border dark:border-white/10 bg-card text-card-foreground shadow-sm">
          {loading && !staff.length ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 dark:bg-white/5">
                <Plus className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium">No profiles found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">You haven't added any {activeTab === 'Internal' ? 'internal' : 'trainer'} profiles yet.</p>
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
                {filteredStaff.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {profile.profilePictureUrl ? (
                          <img src={profile.profilePictureUrl} alt={profile.name} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[#2a2e25] flex items-center justify-center text-[#88cc22] font-bold text-sm tracking-widest">
                            {getInitials(profile.name)}
                          </div>
                        )}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem onClick={() => handleOpen(profile)} className="rounded-lg gap-2 cursor-pointer text-slate-600 dark:text-slate-300"><Pencil className="h-4 w-4" /> Edit details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(profile.id)} className="rounded-lg gap-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/50"><Trash className="h-4 w-4" /> Delete</DropdownMenuItem>
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
