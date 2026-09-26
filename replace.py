import sys

with open('c:/Users/r3x/TheDirtyKitchen/frontend/src/pages/admin/BookingsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = '''        <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
          <Button onClick={saveReschedule} disabled={busy} className="w-full h-11 font-bold text-[14px]">
            Reschedule Booking{busy && <LoadingIndicator className="ml-2" label="Rescheduling booking" />}
          </Button>
        </div>'''

new = '''        <div className="p-4 sm:px-7 bg-slate-50 dark:bg-[#252527] border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 shrink-0 rounded-b-2xl">
          <button 
            className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg h-9 px-4 text-[13px] font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[.98] border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:border-white/15 dark:bg-[#3a3a3c] dark:text-slate-100 dark:hover:bg-[#48484a] dark:hover:text-white" 
            onClick={() => setReschedule(null)}
            disabled={busy}
          >
            Cancel
          </button>
          <button 
            onClick={saveReschedule}
            disabled={busy}
            className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg h-9 px-4 text-[13px] font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[.98] bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            Reschedule Booking
            {busy && <LoadingIndicator label="Rescheduling booking" />}
          </button>
        </div>'''

if old in content:
    content = content.replace(old, new)
    with open('c:/Users/r3x/TheDirtyKitchen/frontend/src/pages/admin/BookingsPage.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced')
else:
    print('Old string not found')
