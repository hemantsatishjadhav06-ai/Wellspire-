export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const num = (n) => new Intl.NumberFormat('en-IN').format(Number(n) || 0);

export const dateFmt = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// Deterministic soft color from a string (for avatars)
export const colorFor = (str = '') => {
  const palette = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

export const statusColor = (status) => {
  const map = {
    paid: 'emerald', pending: 'amber', overdue: 'rose', partially_paid: 'sky',
    issued: 'sky', returned: 'emerald', lost: 'rose',
    present: 'emerald', absent: 'rose', late: 'amber', excused: 'slate',
  };
  return map[status] || 'slate';
};
