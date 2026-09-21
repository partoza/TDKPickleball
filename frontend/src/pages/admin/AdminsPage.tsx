import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowPathIcon, EnvelopeIcon, PlusIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { authService } from '@/services/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const empty = { firstName: '', lastName: '', email: '', role: 'Staff' };

export default function AdminsPage() {
  const client = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['system-users'], queryFn: authService.getUsers });
  const [open, setOpen] = useState(false); const [form, setForm] = useState(empty); const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useMutation({ mutationFn: authService.createUser, onSuccess: result => { if (!result.success) return toast.error(result.message); client.invalidateQueries({ queryKey: ['system-users'] }); setOpen(false); setForm(empty); toast.success('User added and invitation sent'); }, onError: (error: any) => toast.error(error.response?.data?.message || 'User could not be added') });
  const save = () => { const next: Record<string, string> = {}; if (!form.firstName.trim()) next.firstName = 'First name is required.'; if (!form.lastName.trim()) next.lastName = 'Last name is required.'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.'; setErrors(next); if (!Object.keys(next).length) create.mutate(form); };
  const users = data?.data || [];
  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">User management</h1><p className="mt-1 text-muted-foreground">Create administrator and staff access with secure first-login setup.</p></div><Button onClick={() => { setForm(empty); setErrors({}); setOpen(true); }}><PlusIcon className="h-4 w-4" />Add User</Button></div><Card className="rounded-2xl"><CardHeader><CardTitle>Team accounts</CardTitle><CardDescription>Staff can access Overview, Schedule, and Bookings. Administrators can access the full system.</CardDescription></CardHeader><CardContent>{isLoading ? <div className="space-y-3">{[1,2].map(x => <Skeleton key={x} className="h-16 rounded-xl" />)}</div> : <div className="grid gap-3">{users.map(user => <div key={user.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">{user.role === 'Admin' ? <ShieldCheckIcon className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}</span><div><p className="font-semibold">{user.firstName} {user.lastName}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><EnvelopeIcon className="h-3.5 w-3.5" />{user.email}</p></div></div><div className="flex flex-wrap gap-2"><Badge variant="outline">{user.role}</Badge>{user.mustChangePassword && <Badge className="bg-amber-500 text-white">Invitation pending</Badge>}<Badge variant={user.isActive ? 'default' : 'secondary'}>{user.isActive ? 'Active' : 'Inactive'}</Badge></div></div>)}</div>}</CardContent></Card><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Add team member</DialogTitle><DialogDescription>A temporary password will be generated and sent to their email. SMTP must be configured.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><Field label="First name" value={form.firstName} error={errors.firstName} onChange={value => setForm({ ...form, firstName: value })} /><Field label="Last name" value={form.lastName} error={errors.lastName} onChange={value => setForm({ ...form, lastName: value })} /><div className="sm:col-span-2"><Field label="Email" type="email" value={form.email} error={errors.email} onChange={value => setForm({ ...form, email: value })} /></div><div className="sm:col-span-2"><Label>Role</Label><Select value={form.role} onValueChange={role => setForm({ ...form, role })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Staff">Staff</SelectItem><SelectItem value="Admin">Admin</SelectItem></SelectContent></Select></div></div><Button onClick={save} disabled={create.isPending}>Send Invitation{create.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}</Button></DialogContent></Dialog></div>;
}

function Field({ label, value, error, type = 'text', onChange }: { label: string; value: string; error?: string; type?: string; onChange: (value: string) => void }) { return <div><Label>{label} *</Label><Input type={type} value={value} aria-invalid={!!error} onChange={event => onChange(event.target.value)} />{error && <p className="field-error">{error}</p>}</div>; }
