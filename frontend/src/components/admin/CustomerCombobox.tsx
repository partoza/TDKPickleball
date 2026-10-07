import { useEffect, useId, useRef, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import type { Customer } from '@/types';
import { customerService } from '@/services/customers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type CustomerComboboxProps = {
  value?: number | null;
  onSelect: (customer: Customer) => void;
  onClear: () => void;
};

export function CustomerCombobox({ value, onSelect, onClear }: CustomerComboboxProps) {
  const id = useId();
  const requestId = useRef(0);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    if (!open) return;

    const currentRequest = ++requestId.current;
    let active = true;
    setSearching(true);
    setSearchFailed(false);

    // Search automatically after a brief pause while typing. No Enter key is required.
    const timer = window.setTimeout(async () => {
      try {
        const result = await customerService.search(query.trim());
        if (!active || currentRequest !== requestId.current) return;
        setOptions(result);
        setHighlightedIndex(result.length ? 0 : -1);
      } catch {
        if (!active || currentRequest !== requestId.current) return;
        setOptions([]);
        setHighlightedIndex(-1);
        setSearchFailed(true);
      } finally {
        if (active && currentRequest === requestId.current) setSearching(false);
      }
    }, 120);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const selectCustomer = (customer: Customer) => {
    onSelect(customer);
    setQuery(`${customer.fullName} (@${customer.username})`);
    setOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div className="relative sm:col-span-2">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">Link active customer (optional)</label>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={highlightedIndex >= 0 ? `${id}-option-${options[highlightedIndex]?.id}` : undefined}
          autoComplete="off"
          className="pl-9 pr-10"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={event => {
            setQuery(event.target.value);
            setOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={event => {
            if (!open || !options.length) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setHighlightedIndex(index => (index + 1) % options.length);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setHighlightedIndex(index => (index <= 0 ? options.length - 1 : index - 1));
            } else if (event.key === 'Enter' && highlightedIndex >= 0) {
              event.preventDefault();
              selectCustomer(options[highlightedIndex]);
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={value ? 'Customer linked — search to change' : 'Start typing a name, username, email, or phone'}
        />
        {value && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1 h-8 w-8 p-0"
            aria-label="Use manual customer"
            onClick={() => {
              onClear();
              setQuery('');
              setOpen(true);
            }}
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {open && (
        <div id={`${id}-list`} role="listbox" className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
          {searching && <div className="px-3 py-3 text-center text-sm text-muted-foreground">Searching as you type…</div>}
          {!searching && searchFailed && <div className="px-3 py-4 text-center text-sm text-destructive">Unable to load customers. Please try again.</div>}
          {!searching && !searchFailed && options.map((customer, index) => (
            <button
              id={`${id}-option-${customer.id}`}
              type="button"
              role="option"
              aria-selected={customer.id === value}
              key={customer.id}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${index === highlightedIndex ? 'bg-accent' : 'hover:bg-accent'}`}
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => selectCustomer(customer)}
            >
              <span className="block font-medium">{customer.fullName} · @{customer.username}</span>
              <span className="block text-xs text-muted-foreground">{customer.email}{customer.phone ? ` · ${customer.phone}` : ''}</span>
            </button>
          ))}
          {!searching && !searchFailed && !options.length && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">No active customers match your search. Continue as a manual/walk-in booking.</div>
          )}
        </div>
      )}
      <p className="mt-1 text-xs text-muted-foreground">Suggestions update automatically while you type. Selecting one fills the customer’s saved contact details.</p>
    </div>
  );
}
