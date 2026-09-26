import sys

with open('c:/Users/r3x/TheDirtyKitchen/frontend/src/pages/admin/DashboardPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_header = """      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg">{court.name}</h3>
          {activeBooking ? (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Currently in use</span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">Available</span>
          )}
        </div>
        {activeBooking && (
          <div className="text-right">
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">{getRemainingTime(activeBooking.endTime)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{formatHour(activeBooking.startTime)} - {formatHour(activeBooking.endTime)}</div>
          </div>
        )}
      </div>"""

new_header = """      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg leading-none m-0">{court.name}</h3>
        {timeStr < '08:00:00' ? (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">Closed</span>
        ) : activeBooking ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-bold text-rose-600 dark:text-rose-400 animate-pulse">{getRemainingTime(activeBooking.endTime)}</div>
              <div className="text-[10px] text-muted-foreground">{formatHour(activeBooking.startTime)} - {formatHour(activeBooking.endTime)}</div>
            </div>
            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">In use</span>
          </div>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Available</span>
        )}
      </div>"""

if old_header in content:
    content = content.replace(old_header, new_header)
    with open('c:/Users/r3x/TheDirtyKitchen/frontend/src/pages/admin/DashboardPage.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced')
else:
    print('Failed to find target')
