import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowPathIcon, KeyIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PasswordPage({ forced = false }: { forced?: boolean }) {
  const { user, isAuthenticated, isLoading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  if (isLoading) return <div className="min-h-screen grid place-items-center"><ArrowPathIcon className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!isAuthenticated) return <Navigate to={ROUTES.ADMIN.LOGIN} replace />;
  if (forced && !user?.mustChangePassword) return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;

  const save = async () => {
    const next: Record<string, string> = {};
    if (!forced && !form.currentPassword) next.currentPassword = 'Current password is required.';
    if (form.newPassword.length < 8) next.newPassword = 'Use at least 8 characters.';
    if (!/[A-Z]/.test(form.newPassword) || !/[a-z]/.test(form.newPassword) || !/\d/.test(form.newPassword) || !/[^A-Za-z0-9]/.test(form.newPassword)) next.newPassword = 'Include uppercase, lowercase, number, and symbol.';
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next); if (Object.keys(next).length) return;
    setSaving(true);
    try { const result = await authService.changePassword(form); if (!result.success) throw new Error(result.message); if (forced) { logout(); toast.success('Password created. Sign in with your new password'); navigate(ROUTES.ADMIN.LOGIN); } else { await refreshUser(); toast.success('Password changed successfully'); navigate(ROUTES.ADMIN.DASHBOARD); } }
    catch (error: any) { toast.error(error.response?.data?.message || error.message || 'Password could not be changed'); }
    finally { setSaving(false); }
  };

  return <div className={forced ? 'min-h-screen grid place-items-center bg-muted/40 p-4' : 'mx-auto max-w-xl py-4'}><Card className="w-full rounded-2xl shadow-sm"><CardHeader><div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><KeyIcon className="h-5 w-5" /></div><CardTitle>{forced ? `Welcome, ${user?.firstName}` : 'Change password'}</CardTitle><CardDescription>{forced ? 'Create a private password before continuing to the administration portal.' : 'Update the password used to sign in to your account.'}</CardDescription></CardHeader><CardContent className="space-y-4">{!forced && <PasswordField label="Current password" value={form.currentPassword} error={errors.currentPassword} onChange={value => setForm({ ...form, currentPassword: value })} />}<PasswordField label="New password" value={form.newPassword} error={errors.newPassword} onChange={value => setForm({ ...form, newPassword: value })} /><PasswordField label="Confirm new password" value={form.confirmPassword} error={errors.confirmPassword} onChange={value => setForm({ ...form, confirmPassword: value })} /><p className="text-xs text-muted-foreground">Use 8 or more characters with uppercase, lowercase, a number, and a symbol.</p><Button className="w-full" onClick={save} disabled={saving}>Save Password{saving && <ArrowPathIcon className="h-4 w-4 animate-spin" />}</Button></CardContent></Card></div>;
}

function PasswordField({ label, value, error, onChange }: { label: string; value: string; error?: string; onChange: (value: string) => void }) {
  return <div><Label>{label}</Label><Input type="password" value={value} aria-invalid={!!error} onChange={event => onChange(event.target.value)} />{error && <p className="field-error">{error}</p>}</div>;
}
