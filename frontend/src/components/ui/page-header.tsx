import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  moduleBadge?: string;
  moduleBadgeIcon?: LucideIcon;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
}

export function PageHeader({
  moduleBadge,
  moduleBadgeIcon: BadgeIcon,
  title,
  description,
  backHref,
  backLabel = 'ย้อนกลับ',
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 pb-6">
      {backHref && (
        <div className="flex items-center justify-between pb-1">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition hover:-translate-x-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {moduleBadge && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                {moduleBadge}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="flex items-center gap-2.5">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
