import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, KeyIcon, PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth';
import { getApiErrorMessage } from '@/services/api';
import { ROUTES } from '@/lib/constants';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function PasswordPage({ forced = false }: { forced?: boolean }) {
  const { user, isAuthenticated, isLoading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [imageConfirmOpen, setImageConfirmOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  if (isLoading) return <div className="min-h-screen grid place-items-center"><LoadingIndicator size="lg" className="text-primary" label="Loading profile" /></div>;
  if (!isAuthenticated) return <Navigate to={ROUTES.ADMIN.LOGIN} replace />;
  if (forced && !user?.mustChangePassword) return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!forced && !form.currentPassword) next.currentPassword = 'Current password is required.';
    if (form.newPassword.length < 8) next.newPassword = 'Use at least 8 characters.';
    if (!/[A-Z]/.test(form.newPassword) || !/[a-z]/.test(form.newPassword) || !/\d/.test(form.newPassword) || !/[^A-Za-z0-9]/.test(form.newPassword)) next.newPassword = 'Include uppercase, lowercase, number, and symbol.';
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    if (!Object.keys(next).length) setConfirmOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const result = await authService.changePassword(form);
      if (!result.success) throw new Error(result.message);
      setConfirmOpen(false);
      if (forced) {
        logout();
        toast.success('Password created. Sign in with your new password');
        navigate(ROUTES.ADMIN.LOGIN);
      } else {
        await refreshUser();
        toast.success('Password changed successfully');
        navigate(ROUTES.ADMIN.DASHBOARD);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, error instanceof Error ? error.message : 'Password could not be changed'));
    } finally {
      setSaving(false);
    }
  };

  const chooseProfileImage = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error('Choose a JPEG, PNG, or WebP image');
    if (file.size > 5 * 1024 * 1024) return toast.error('Profile images must be 5 MB or smaller');
    setPendingImage(file);
    setImageConfirmOpen(true);
  };

  const uploadProfileImage = async () => {
    if (!pendingImage) return;
    setUploadingImage(true);
    try {
      const result = await authService.uploadMyProfileImage(pendingImage);
      if (!result.success) throw new Error(result.message);
      await refreshUser();
      setImageConfirmOpen(false);
      setPendingImage(null);
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, error instanceof Error ? error.message : 'Profile picture could not be updated'));
    } finally {
      setUploadingImage(false);
    }
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return <div className={forced ? 'min-h-screen grid place-items-center bg-muted/40 p-4' : 'mx-auto max-w-5xl space-y-6 py-4'}>
    {!forced && <div><h1 className="text-3xl font-bold tracking-tight">Profile</h1><p className="mt-1 text-muted-foreground">Review your account information, photo, and sign-in security.</p></div>}
    <div className={forced ? 'w-full max-w-xl' : 'grid gap-6 lg:grid-cols-[0.9fr_1.1fr]'}>
      {!forced && <div className="space-y-6">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><UserCircleIcon className="h-6 w-6" /></div><CardTitle>Account information</CardTitle><CardDescription>Your signed-in account details.</CardDescription></CardHeader>
          <CardContent><div className="flex items-center gap-4"><Avatar className="h-20 w-20 border"><AvatarImage src={user?.profileImageUrl} alt={`${user?.firstName} ${user?.lastName}`} /><AvatarFallback className="text-lg font-semibold">{initials || <PhotoIcon className="h-7 w-7" />}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate text-lg font-bold">{user?.firstName} {user?.lastName}</p><p className="truncate text-sm text-muted-foreground">{user?.email}</p><Badge className="mt-2">{user?.role}</Badge></div></div></CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle>Profile picture</CardTitle><CardDescription>JPEG, PNG, or WebP up to 5 MB. Replacing it removes the previous Cloudinary image.</CardDescription></CardHeader>
          <CardContent><Label htmlFor="my-profile-image">Choose a new image</Label><Input id="my-profile-image" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} onChange={event => chooseProfileImage(event.target.files?.[0])} /><p className="mt-2 text-xs text-muted-foreground">The new photo is saved only after upload succeeds.</p>{uploadingImage && <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><LoadingIndicator size="xs" label="Uploading profile image" />Uploading securely…</p>}</CardContent>
        </Card>
      </div>}
      <Card className="w-full rounded-2xl shadow-sm">
        <CardHeader><div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><KeyIcon className="h-5 w-5" /></div><CardTitle>{forced ? `Welcome, ${user?.firstName}` : 'Change password'}</CardTitle><CardDescription>{forced ? 'Create a private password before continuing to the administration portal.' : 'Update the password used to sign in to your account.'}</CardDescription></CardHeader>
        <CardContent className="space-y-4">{!forced && <PasswordField label="Current password" placeholder="Enter your current password" value={form.currentPassword} error={errors.currentPassword} onChange={value => setForm({ ...form, currentPassword: value })} />}<PasswordField label="New password" placeholder="Create a new password" value={form.newPassword} error={errors.newPassword} onChange={value => setForm({ ...form, newPassword: value })} /><PasswordField label="Confirm new password" placeholder="Re-enter your new password" value={form.confirmPassword} error={errors.confirmPassword} onChange={value => setForm({ ...form, confirmPassword: value })} /><p className="text-xs text-muted-foreground">Use 8 or more characters with uppercase, lowercase, a number, and a symbol.</p><div className="flex justify-end gap-2 pt-2">{!forced && <Button type="button" variant="outline" onClick={() => navigate(ROUTES.ADMIN.DASHBOARD)}>Cancel</Button>}<Button onClick={validate} disabled={saving}>Save password</Button></div></CardContent>
      </Card>
    </div>
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Save your new password?</AlertDialogTitle><AlertDialogDescription>You will use this password the next time you sign in. Confirm that you want to update your account security.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel><AlertDialogAction onClick={event => { event.preventDefault(); void save(); }} disabled={saving}>Confirm and save{saving && <LoadingIndicator label="Saving password" />}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={imageConfirmOpen} onOpenChange={open => { if (!uploadingImage) { setImageConfirmOpen(open); if (!open) setPendingImage(null); } }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Replace your profile picture?</AlertDialogTitle><AlertDialogDescription>The new image will be uploaded and your previous Cloudinary image will be permanently removed to save storage.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={uploadingImage}>Cancel</AlertDialogCancel><AlertDialogAction onClick={event => { event.preventDefault(); void uploadProfileImage(); }} disabled={uploadingImage}>Confirm and upload{uploadingImage && <LoadingIndicator label="Uploading profile image" />}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
}

function PasswordField({ label, placeholder, value, error, onChange }: { label: string; placeholder: string; value: string; error?: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return <div className="space-y-2"><Label>{label}</Label><div className="relative"><Input type={visible ? 'text' : 'password'} value={value} placeholder={placeholder} className="pr-11" aria-invalid={!!error} autoComplete="new-password" onChange={event => onChange(event.target.value)} /><button type="button" className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => setVisible(current => !current)} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>{visible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button></div>{error && <p className="field-error">{error}</p>}</div>;
}
