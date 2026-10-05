import { useEffect, useId, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import type { Customer } from '@/types';
import { customerService } from '@/services/customers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function CustomerCombobox({ value, onSelect, onClear }: { value?: number | null; onSelect: (customer: Customer) => void; onClear: () => void }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = window.setTimeout(() => customerService.search(query).then(result => active && setOptions(result)).catch(() => active && setOptions([])), 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, open]);
  return <div className="relative sm:col-span-2"><label htmlFor={id} className="mb-1.5 block text-sm font-medium">Link active customer (optional)</label><div className="relative"><MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id={id} role="combobox" aria-expanded={open} aria-controls={`${id}-list`} autoComplete="off" className="pl-9 pr-10" value={query} onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setOpen(true); }} placeholder={value ? 'Customer linked — search to change' : 'Search name, username, email, or phone'} />{value && <Button type="button" size="sm" variant="ghost" className="absolute right-1 top-1 h-8 w-8 p-0" aria-label="Use manual customer" onClick={() => { onClear(); setQuery(''); }}><XMarkIcon className="h-4 w-4" /></Button>}</div>{open && <div id={`${id}-list`} role="listbox" className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg">{options.map(customer => <button type="button" role="option" aria-selected={customer.id === value} key={customer.id} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent" onMouseDown={event => event.preventDefault()} onClick={() => { onSelect(customer); setQuery(`${customer.fullName} (@${customer.username})`); setOpen(false); }}><span className="block font-medium">{customer.fullName} · @{customer.username}</span><span className="block text-xs text-muted-foreground">{customer.email}{customer.phone ? ` · ${customer.phone}` : ''}</span></button>)}{!options.length && <div className="px-3 py-4 text-center text-sm text-muted-foreground">No active customers found. Continue as a manual/walk-in booking.</div>}</div>}<p className="mt-1 text-xs text-muted-foreground">Selecting links CustomerId and uses the server-authoritative contact details. Clear to use a manual customer.</p></div>;
}
