import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, PauseCircle } from 'lucide-react';

interface ScholarshipTypeStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function ScholarshipTypeStatusBadge({
  isActive,
  className = '',
}: ScholarshipTypeStatusBadgeProps) {
  if (isActive) {
    return (
      <Badge
        variant="success"
        className={`inline-flex items-center gap-1.5 font-medium px-2.5 py-0.5 rounded-full ${className}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>เปิดใช้งาน</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`inline-flex items-center gap-1.5 font-medium px-2.5 py-0.5 rounded-full text-muted-foreground ${className}`}
    >
      <PauseCircle className="h-3.5 w-3.5" />
      <span>ปิดการใช้งาน</span>
    </Badge>
  );
}
