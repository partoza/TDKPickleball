import os
file1 = r'c:\Users\r3x\TheDirtyKitchen\frontend\src\pages\admin\SchedulePage.tsx'
content = open(file1, 'r', encoding='utf-8').read()
old_code = '''function getTimedStatus(slot: Schedule) {
  const base = STATUS_LABELS[slot.status];
  if (slot.status === ScheduleStatus.Unavailable || slot.status === ScheduleStatus.Available) return { label: base, phase: 'scheduled' as const };
  const start = new Date(${slot.date}T);
  const end = new Date(${slot.date}T);
  if (end <= start) end.setDate(end.getDate() + 1);
  const now = new Date();
  if (now >= end) return { label: Completed , phase: 'completed' as const };
  if (now >= start) return { label: Ongoing , phase: 'ongoing' as const };
  return { label: base, phase: 'scheduled' as const };
}'''.replace('\n', '\r\n')
new_code = '''function getTimedStatus(slot: Schedule, internalCoaches?: any[]) {
  let base = STATUS_LABELS[slot.status];
  if (slot.status === ScheduleStatus.Internal && slot.internalCoachProfileId && internalCoaches) {
    const coach = internalCoaches.find((c: any) => c.id === slot.internalCoachProfileId);
    if (coach) base = coach.name;
  }
  if (slot.status === ScheduleStatus.Unavailable || slot.status === ScheduleStatus.Available) return { label: base, phase: 'scheduled' as const };
  const start = new Date(${slot.date}T);
  const end = new Date(${slot.date}T);
  if (end <= start) end.setDate(end.getDate() + 1);
  const now = new Date();
  if (now >= end) return { label: Completed , phase: 'completed' as const };
  if (now >= start) return { label: Ongoing , phase: 'ongoing' as const };
  return { label: base, phase: 'scheduled' as const };
}'''.replace('\n', '\r\n')
content = content.replace(old_code, new_code)
open(file1, 'w', encoding='utf-8', newline='').write(content)
