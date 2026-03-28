interface EmptyStateProps {
  title: string;
  description?: string;
  illustration?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const defaultIllustrations: Record<string, string> = {
  'no-data': '/storyset-illustrations/Under construction-amico.svg',
  'no-results': '/storyset-illustrations/Construction-rafiki.svg',
  'error': '/storyset-illustrations/Bug fixing-amico.svg',
  'maintenance': '/storyset-illustrations/Maintenance-amico.svg',
  'empty': '/storyset-illustrations/Work life balance-rafiki.svg',
  'search': '/storyset-illustrations/Task-amico.svg',
  'offline': '/storyset-illustrations/Phone maintenance-bro.svg',
  'success': '/storyset-illustrations/Work anniversary-amico.svg',
};

export function EmptyState({ 
  title, 
  description, 
  illustration = 'empty',
  action 
}: EmptyStateProps) {
  const illustrationPath = defaultIllustrations[illustration] || illustration;
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <img 
        src={illustrationPath} 
        alt={title}
        className="w-48 h-48 mb-6"
      />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
