import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-gray-100">
        <div className="text-gray-300 w-10 h-10 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-display text-tbp-dark mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
