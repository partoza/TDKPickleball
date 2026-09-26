import sys

with open('c:/Users/r3x/TheDirtyKitchen/frontend/src/pages/admin/AdminWidgetPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_upcoming_logic = """  const upcoming = useMemo(() => bookings.filter(booking => booking.status !== 'Cancelled' && (booking.bookingDate > now.date || (booking.bookingDate === now.date && minutesFromTime(booking.startTime) > now.minutes))).sort((a, b) => `${a.bookingDate}${a.startTime}`.localeCompare(`${b.bookingDate}${b.startTime}`)).slice(0, 4), [bookings, now]);"""

new_upcoming_logic = """  const upcoming = useMemo(() => {
    const future = bookings.filter(booking => booking.status !== 'Cancelled' && (booking.bookingDate > now.date || (booking.bookingDate === now.date && minutesFromTime(booking.startTime) > now.minutes))).sort((a, b) => `${a.bookingDate}${a.startTime}`.localeCompare(`${b.bookingDate}${b.startTime}`));
    const court1Upcoming = courts[0] ? future.filter(b => b.courtId === courts[0].id).slice(0, 2) : [];
    const court2Upcoming = courts[1] ? future.filter(b => b.courtId === courts[1].id).slice(0, 2) : [];
    return [...court1Upcoming, ...court2Upcoming].sort((a, b) => `${a.bookingDate}${a.startTime}`.localeCompare(`${b.bookingDate}${b.startTime}`));
  }, [bookings, now, courts]);"""

if old_upcoming_logic in content:
    content = content.replace(old_upcoming_logic, new_upcoming_logic)
else:
    print('Failed to find upcoming logic')

old_upcoming_jsx = """          <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-2">{upcoming.map(booking => <article key={booking.id} className="flex items-center justify-between gap-4 rounded-[20px] border border-white/60 bg-white/50 p-4 shadow-sm backdrop-blur-md"><div className="min-w-0"><p className="text-[15px] font-semibold tracking-[-0.02em]">{format(new Date(`${booking.bookingDate}T00:00:00`), 'MMM d')} · {displayTime(booking.startTime)}–{displayTime(booking.endTime)}</p><p className="mt-1 text-[12px] text-[#6e6e73]">Scheduled session</p></div><span className="shrink-0 rounded-full border border-[#851923]/20 bg-white/60 px-2.5 py-1 text-[11px] font-semibold text-[#851923] shadow-sm">{booking.courtName}</span></article>)}{!upcoming.length && <p className="rounded-[20px] border border-white/60 bg-white/50 p-5 text-[13px] tracking-[-0.01em] text-[#6e6e73] shadow-sm backdrop-blur-md sm:col-span-2">No upcoming schedules.</p>}</div>"""

new_upcoming_jsx = """          <div className="relative z-10 mt-4 grid gap-4 sm:grid-cols-2">{upcoming.map(booking => <article key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[24px] border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-md"><div className="min-w-0"><p className="text-[17px] font-bold tracking-[-0.02em]">{format(new Date(`${booking.bookingDate}T00:00:00`), 'MMM d')} · {displayTime(booking.startTime)}–{displayTime(booking.endTime)}</p><p className="mt-1.5 text-[14px] font-medium text-[#6e6e73]">Scheduled session</p></div><span className="shrink-0 rounded-full border border-[#851923]/20 bg-white/60 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-wider text-[#851923] shadow-sm">{booking.courtName}</span></article>)}{!upcoming.length && <p className="rounded-[24px] border border-white/60 bg-white/50 p-6 text-[14px] font-medium tracking-[-0.01em] text-[#6e6e73] shadow-sm backdrop-blur-md sm:col-span-2">No upcoming schedules.</p>}</div>"""

if old_upcoming_jsx in content:
    content = content.replace(old_upcoming_jsx, new_upcoming_jsx)
else:
    print('Failed to find upcoming JSX')

with open('c:/Users/r3x/TheDirtyKitchen/frontend/src/pages/admin/AdminWidgetPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
