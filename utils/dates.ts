const ES_TZ = 'America/El_Salvador';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function nowES(): string {
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ES_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}-06:00`;
}

export function todayES(): string {
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ES_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function toSQLDatetimeES(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ES_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

export function toISOWithOffset(dateStr: string): string {
  if (!dateStr) return '';
  const cleaned = dateStr.includes('T') ? dateStr.replace(' ', 'T') : dateStr.replace(' ', 'T');
  if (cleaned.endsWith('Z')) return cleaned.slice(0, -1) + '-06:00';
  if (cleaned.includes('+') || cleaned.includes('-') && cleaned.length > 20) return cleaned;
  return cleaned + '-06:00';
}

export function formatDateES(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const iso = toISOWithOffset(dateStr);
    return new Date(iso).toLocaleDateString('es-SV', {
      timeZone: ES_TZ,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch { return dateStr; }
}

export function formatTimeES(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const iso = toISOWithOffset(dateStr);
    return new Date(iso).toLocaleTimeString('es-SV', {
      timeZone: ES_TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch { return ''; }
}

export function formatDateTimeES(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const iso = toISOWithOffset(dateStr);
    return new Date(iso).toLocaleString('es-SV', {
      timeZone: ES_TZ,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch { return dateStr; }
}

export function formatMonthYearES(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleString('es-ES', {
    timeZone: ES_TZ,
    month: 'long',
    year: 'numeric',
  });
}

export function formatWeekdayES(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const iso = toISOWithOffset(dateStr);
    return new Date(iso).toLocaleDateString('es-SV', {
      timeZone: ES_TZ,
      weekday: 'long',
    });
  } catch { return ''; }
}

export function isSameDayES(dateStr1: string, dateStr2: string): boolean {
  return toISOWithOffset(dateStr1).split('T')[0] === toISOWithOffset(dateStr2).split('T')[0];
}

export function dateFromPartsES(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month - 1, day, 6, 0, 0));
  return d.toISOString().split('T')[0];
}

export function getMonthDaysES(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0, 6, 0, 0)).getDate();
}

export function getFirstDayOfMonthES(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1, 6, 0, 0)).getDay();
}
