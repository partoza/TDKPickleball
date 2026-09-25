import { useEffect, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

export type AdminDeleteCredentials = { email: string; password: string };

export function AdminCredentialDeleteDialog({ open, title, description, pending = false, onOpenChange, onConfirm }: {
  open: boolean;
  title: string;
  description: string;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (credentials: AdminDeleteCredentials) => void | Promise<void>;
}) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const busy = pending || submitting;

  useEffect(() => {
    if (open) {
      setEmail(user?.email || '');
      setPassword('');
      setShowPassword(false);
      setSubmitting(false);
    }
  }, [open, user?.email]);

  const confirm = async () => {
    setSubmitting(true);
    try { await onConfirm({ email: email.trim(), password }); }
    finally { setSubmitting(false); }
  };

  return <Dialog open={open} onOpenChange={value => !busy && onOpenChange(value)}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description} Confirm using the email and password of the currently signed-in administrator.</DialogDescription></DialogHeader>
      <div className="space-y-4 py-1">
        <div className="space-y-2"><Label htmlFor="delete-admin-email">Admin email</Label><Input id="delete-admin-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Signed-in admin email" autoComplete="username" /></div>
        <div className="space-y-2"><Label htmlFor="delete-admin-password">Password</Label><div className="relative"><Input id="delete-admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" className="pr-11" autoComplete="current-password" /><button type="button" className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button></div></div>
      </div>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" variant="destructive" disabled={busy || !email.trim() || !password} onClick={confirm}>{busy && <LoadingIndicator label="Deleting" />}Permanently delete</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
