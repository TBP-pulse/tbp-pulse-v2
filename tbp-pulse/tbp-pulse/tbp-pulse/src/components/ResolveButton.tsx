import { useState } from 'react';

export default function ResolveButton({ alertId }: { alertId: string }) {
  const [resolved, setResolved] = useState(false);

  const handleResolve = () => {
    // Mock resolve action
    setResolved(true);
  };

  if (resolved) {
    return (
      <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg shrink-0">
        Rezolvat
      </span>
    );
  }

  return (
    <button onClick={handleResolve}
      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg shrink-0 transition-colors">
      Rezolvă ✓
    </button>
  )
}
