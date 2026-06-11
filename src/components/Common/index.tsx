import { Loader2 } from "lucide-react";

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <Loader2 className="w-8 h-8 text-olive-600 animate-spin" />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-cream-200 flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-earth-400" />
      </div>
      <h3 className="font-serif text-xl font-semibold text-earth-700 mb-2">{title}</h3>
      {description && (
        <p className="text-earth-500 text-sm mb-6 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  value,
  label,
  color = "olive",
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color?: "olive" | "earth" | "cream" | "amber";
}) {
  const colorMap = {
    olive: "from-olive-500 to-olive-700",
    earth: "from-earth-500 to-earth-700",
    cream: "from-cream-400 to-cream-500",
    amber: "from-amber-500 to-amber-700",
  };

  return (
    <div className="card card-hover p-4 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-md flex-shrink-0`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-serif font-bold text-earth-800 leading-none">
          {value}
        </div>
        <div className="text-sm text-earth-500 mt-1 truncate">{label}</div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-earth-800">
          {title}
        </h1>
        {subtitle && (
          <p className="text-earth-500 mt-1 text-sm">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}
