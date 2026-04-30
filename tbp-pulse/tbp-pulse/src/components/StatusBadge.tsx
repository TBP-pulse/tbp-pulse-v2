export type BadgeStatus = 'green' | 'yellow' | 'red' | 'todo' | 'in_progress' | 'review' | 'needs_changes' | 'blocked' | 'done' | 'archived' | 'pending';

export default function StatusBadge({ status, size = 'md' }: { status: BadgeStatus, size?: 'sm' | 'md' }) {
  const colors: Record<string, { bg: string, text: string, dot: string, label: string }> = {
    // Project Health Statuses
    green: { bg: 'bg-status-green-bg', text: 'text-emerald-700', dot: 'bg-status-green', label: 'În Grafic' },
    yellow: { bg: 'bg-status-yellow-bg', text: 'text-amber-700', dot: 'bg-status-yellow', label: 'Atenție' },
    red: { bg: 'bg-status-red-bg', text: 'text-red-700', dot: 'bg-status-red', label: 'Blocat' },
    
    // Task Statuses
    todo: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'De Făcut' },
    pending: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'În Așteptare' },
    in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'În Lucru' },
    review: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'În Review' },
    needs_changes: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', label: 'De Ajustat' },
    blocked: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Blocat' },
    done: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Finalizat' },
    archived: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-300', label: 'Arhivat' },
  }
  
  const c = colors[status] || colors.todo;
  const isSmall = size === 'sm';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold tracking-wide uppercase ${c.bg} ${c.text} ${
      isSmall ? 'px-2 py-0.5 rounded-md text-[10px]' : 'px-3 py-1 rounded-lg text-[11px]'
    }`}>
      <span className={`rounded-full ${c.dot} ${(status === 'red' || status === 'blocked') ? 'status-pulse' : ''} ${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      {c.label}
    </span>
  );
}
