import { Factory } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-900/20 ${className}`}>
      <Factory className="h-5 w-5 text-white" />
    </div>
  );
}
