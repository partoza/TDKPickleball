import sys

with open('c:/Users/r3x/TheDirtyKitchen/frontend/src/pages/admin/AdminWidgetPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_header = """      <header className="mb-7 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
        <div className="flex items-center gap-3.5"><div className="grid h-[58px] w-[58px] place-items-center overflow-hidden rounded-[18px] border border-black/[0.04] bg-white shadow-[0_5px_18px_-8px_rgba(0,0,0,.4)]"><img src="/assets/images/tdk-icon.png" alt="TDK" className="h-[50px] w-[50px] object-contain" /></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#851923]">TDK Live</p><h1 className="mt-0.5 text-[28px] font-bold leading-none tracking-[-0.045em] sm:text-[36px]">Court Schedule</h1></div></div>
        <button type="button" onClick={() => refetch()} className="grid h-11 w-11 place-items-center rounded-full border border-black/[0.06] bg-white/90 text-[#3a3a3c] shadow-sm backdrop-blur-xl transition hover:bg-white active:scale-95" aria-label="Refresh court schedule">{isFetching ? <LoadingIndicator label="Refreshing court schedule" /> : <ArrowPathIcon className="h-5 w-5" />}</button>
      </header>"""

new_header = """      <header className="mb-7 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
        <div className="flex items-center gap-3.5"><div className="grid h-[58px] w-[58px] place-items-center overflow-hidden rounded-[18px] border border-black/[0.04] bg-white shadow-[0_5px_18px_-8px_rgba(0,0,0,.4)]"><img src="/assets/images/tdk-icon.png" alt="TDK" className="h-[50px] w-[50px] object-contain" /></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#851923]">TDK Live</p><h1 className="mt-0.5 text-[28px] font-bold leading-none tracking-[-0.045em] sm:text-[36px]">Court Schedule</h1></div></div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end justify-center text-right">
            <div className="text-[16px] font-bold tracking-[-0.015em] text-[#1c1c1e] tabular-nums leading-none mb-1">
              {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#8e8e93] leading-none">
              {new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <button type="button" onClick={() => refetch()} className="grid h-11 w-11 place-items-center rounded-full border border-black/[0.06] bg-white/90 text-[#3a3a3c] shadow-sm backdrop-blur-xl transition hover:bg-white active:scale-95" aria-label="Refresh court schedule">{isFetching ? <LoadingIndicator label="Refreshing court schedule" /> : <ArrowPathIcon className="h-5 w-5" />}</button>
        </div>
      </header>"""

old_court_widget = """    <div className="mt-7 flex flex-1 flex-col justify-center rounded-[26px] bg-[#f2f2f7] px-5 py-6 sm:px-7">
      {active ? <><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#851923]">Time remaining</p><p className="mt-2 tabular-nums text-[48px] font-bold leading-none tracking-[-0.06em] text-[#1c1c1e] sm:text-[64px]">{displayCountdown(remainingSeconds)}</p><div className="mt-6 h-2.5 overflow-hidden rounded-full bg-black/[0.07]"><div className="h-full rounded-full bg-[#851923] transition-[width] duration-1000 ease-linear" style={{ width: `${remainingPercent}%` }} /></div><p className="mt-3 text-[14px] font-medium text-[#6e6e73]">Session ends at {displayTime(active.endTime)}</p></> : next ? <><p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8e8e93]">Next session</p><p className="mt-2 text-[36px] font-bold tracking-[-0.045em] text-[#1c1c1e] sm:text-[44px]">{displayTime(next.startTime)}</p><p className="mt-2 text-[14px] text-[#6e6e73]">Court is available until then</p></> : <><p className="text-[24px] font-bold tracking-[-0.035em] text-[#1c1c1e]">Open for the rest of today</p><p className="mt-2 text-[14px] text-[#6e6e73]">No more scheduled sessions</p></>}
    </div>"""

new_court_widget = """    <div className="mt-7 flex flex-1 flex-col justify-center rounded-[26px] bg-[#f2f2f7] px-5 py-6 sm:px-7">
      {now.seconds < 8 * 3600 ? <><p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8e8e93]">Currently Closed</p><p className="mt-2 text-[36px] font-bold tracking-[-0.045em] text-[#1c1c1e] sm:text-[44px]">8:00 AM</p><p className="mt-2 text-[14px] text-[#6e6e73]">Court opens in the morning</p></> : active ? <><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#851923]">Time remaining</p><p className="mt-2 tabular-nums text-[48px] font-bold leading-none tracking-[-0.06em] text-[#1c1c1e] sm:text-[64px]">{displayCountdown(remainingSeconds)}</p><div className="mt-6 h-2.5 overflow-hidden rounded-full bg-black/[0.07]"><div className="h-full rounded-full bg-[#851923] transition-[width] duration-1000 ease-linear" style={{ width: `${remainingPercent}%` }} /></div><p className="mt-3 text-[14px] font-medium text-[#6e6e73]">Session ends at {displayTime(active.endTime)}</p></> : next ? <><p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8e8e93]">Next session</p><p className="mt-2 text-[36px] font-bold tracking-[-0.045em] text-[#1c1c1e] sm:text-[44px]">{displayTime(next.startTime)}</p><p className="mt-2 text-[14px] text-[#6e6e73]">Court is available until then</p></> : <><p className="text-[24px] font-bold tracking-[-0.035em] text-[#1c1c1e]">Available</p><p className="mt-2 text-[14px] text-[#6e6e73]">Open until 12:00 AM</p></>}
    </div>"""

old_status = """<span className={`rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-[-0.01em] ${active ? 'bg-[#851923] text-white' : 'bg-[#34c759]/14 text-[#248a3d]'}`}>{active ? 'In use' : 'Available'}</span>"""
new_status = """<span className={`rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-[-0.01em] ${now.seconds < 8 * 3600 ? 'bg-slate-200 text-slate-500' : active ? 'bg-[#851923] text-white' : 'bg-[#34c759]/14 text-[#248a3d]'}`}>{now.seconds < 8 * 3600 ? 'Closed' : active ? 'In use' : 'Available'}</span>"""

if old_header in content:
    content = content.replace(old_header, new_header)
if old_court_widget in content:
    content = content.replace(old_court_widget, new_court_widget)
if old_status in content:
    content = content.replace(old_status, new_status)

with open('c:/Users/r3x/TheDirtyKitchen/frontend/src/pages/admin/AdminWidgetPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
