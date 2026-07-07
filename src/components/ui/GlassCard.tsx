import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    delay?: number;
}

export default function GlassCard({ children, className = '', hover = false, delay = 0 }: GlassCardProps) {
    return (
        <div
            className={`
        glass-card ${hover ? 'glass-card-hover' : ''}
        ${className}
      `}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}