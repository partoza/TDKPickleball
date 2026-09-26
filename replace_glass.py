import sys

with open('c:/Users/r3x/TheDirtyKitchen/frontend/src/pages/admin/AdminWidgetPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_court_widget = """  return <section className="flex min-h-[330px] flex-col rounded-[34px] border border-black/[0.045] bg-white/92 p-6 text-[#1c1c1e] shadow-[0_20px_55px_-30px_rgba(0,0,0,.45)] backdrop-blur-xl sm:p-8">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8e8e93]">Live court</p><h2 className="mt-1 text-[28px] font-bold tracking-[-0.045em] text-[#1c1c1e] sm:text-[34px]">{court.displayName || court.name}</h2></div>
      <span className={`rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-[-0.01em] ${now.seconds < 8 * 3600 ? 'bg-slate-200 text-slate-500' : active ? 'bg-[#851923] text-white' : 'bg-[#34c759]/14 text-[#248a3d]'}`}>{now.seconds < 8 * 3600 ? 'Closed' : active ? 'In use' : 'Available'}</span>
    </div>
    <div className="mt-7 flex flex-1 flex-col justify-center rounded-[26px] bg-[#f2f2f7] px-5 py-6 sm:px-7">"""

new_court_widget = """  return <section className="relative flex min-h-[330px] flex-col overflow-hidden rounded-[34px] border border-white/40 bg-white/70 p-6 text-[#1c1c1e] shadow-[0_30px_60px_-20px_rgba(0,0,0,.3)] backdrop-blur-2xl sm:p-8">
    <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#88cc22] opacity-[0.15] blur-[50px]" />
    <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#851923] opacity-[0.12] blur-[50px]" />
    <div className="relative z-10 flex items-start justify-between gap-3">
      <div><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8e8e93]">Live court</p><h2 className="mt-1 text-[28px] font-bold tracking-[-0.045em] text-[#1c1c1e] sm:text-[34px]">{court.displayName || court.name}</h2></div>
      <span className={`rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-[-0.01em] ${now.seconds < 8 * 3600 ? 'bg-white/60 text-slate-500 shadow-sm border border-white/40' : active ? 'bg-[#851923] text-white shadow-sm' : 'bg-[#34c759]/20 text-[#248a3d] shadow-sm border border-white/40'}`}>{now.seconds < 8 * 3600 ? 'Closed' : active ? 'In use' : 'Available'}</span>
    </div>
    <div className="relative z-10 mt-7 flex flex-1 flex-col justify-center rounded-[26px] border border-white/60 bg-white/50 px-5 py-6 shadow-sm backdrop-blur-md sm:px-7">"""


old_upcoming = """        <section className="mt-4 rounded-[28px] border border-black/[0.045] bg-white/90 p-5 text-[#1c1c1e] shadow-[0_12px_35px_-24px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-2"><ClockIcon className="h-[18px] w-[18px] text-[#851923]" /><h2 className="text-[17px] font-semibold tracking-[-0.025em]">Upcoming Court Schedule</h2></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{upcoming.map(booking => <article key={booking.id} className="flex items-center justify-between gap-4 rounded-[20px] bg-[#f2f2f7] p-4"><div className="min-w-0"><p className="text-[15px] font-semibold tracking-[-0.02em]">{format(new Date(`${booking.bookingDate}T00:00:00`), 'MMM d')} · {displayTime(booking.startTime)}–{displayTime(booking.endTime)}</p><p className="mt-1 text-[12px] text-[#6e6e73]">Scheduled session</p></div><span className="shrink-0 rounded-full bg-[#851923]/10 px-2.5 py-1 text-[11px] font-semibold text-[#851923]">{booking.courtName}</span></article>)}{!upcoming.length && <p className="rounded-[20px] bg-[#f2f2f7] p-5 text-[13px] tracking-[-0.01em] text-[#6e6e73] sm:col-span-2">No upcoming schedules.</p>}</div>
        </section>"""

new_upcoming = """        <section className="relative mt-4 overflow-hidden rounded-[28px] border border-white/40 bg-white/70 p-5 text-[#1c1c1e] shadow-[0_12px_35px_-24px_rgba(0,0,0,.38)] backdrop-blur-2xl sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#88cc22] opacity-[0.15] blur-[50px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#851923] opacity-[0.12] blur-[50px]" />
          <div className="relative z-10 flex items-center gap-2"><ClockIcon className="h-[18px] w-[18px] text-[#851923]" /><h2 className="text-[17px] font-semibold tracking-[-0.025em]">Upcoming Court Schedule</h2></div>
          <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-2">{upcoming.map(booking => <article key={booking.id} className="flex items-center justify-between gap-4 rounded-[20px] border border-white/60 bg-white/50 p-4 shadow-sm backdrop-blur-md"><div className="min-w-0"><p className="text-[15px] font-semibold tracking-[-0.02em]">{format(new Date(`${booking.bookingDate}T00:00:00`), 'MMM d')} · {displayTime(booking.startTime)}–{displayTime(booking.endTime)}</p><p className="mt-1 text-[12px] text-[#6e6e73]">Scheduled session</p></div><span className="shrink-0 rounded-full border border-[#851923]/20 bg-white/60 shadow-sm px-2.5 py-1 text-[11px] font-semibold text-[#851923]">{booking.courtName}</span></article>)}{!upcoming.length && <p className="rounded-[20px] border border-white/60 bg-white/50 p-5 text-[13px] tracking-[-0.01em] text-[#6e6e73] shadow-sm backdrop-blur-md sm:col-span-2">No upcoming schedules.</p>}</div>
        </section>"""

if old_court_widget in content:
    content = content.replace(old_court_widget, new_court_widget)
else:
    print('Failed to find old court widget')

if old_upcoming in content:
    content = content.replace(old_upcoming, new_upcoming)
else:
    print('Failed to find old upcoming')

with open('c:/Users/r3x/TheDirtyKitchen/frontend/src/pages/admin/AdminWidgetPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
