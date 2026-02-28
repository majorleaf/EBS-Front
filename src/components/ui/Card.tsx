import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', onClick, hoverable = false }: CardProps) {
  const hoverClass = hoverable ? 'hover:shadow-lg transition-shadow cursor-pointer' : '';

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
