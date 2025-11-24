import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full w-full min-h-[300px] bg-white/40 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-xl hover:bg-white/60 transition-colors">
            <div className="bg-slate-100 p-4 rounded-full mb-4 ring-8 ring-slate-50">
                <Icon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 max-w-xs mt-1 mb-6 leading-relaxed">{description}</p>

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    variant="outline"
                    className="border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}