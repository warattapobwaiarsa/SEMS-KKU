import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
}

export function PageHeader({
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

      {(title || action || description) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {title && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          )}

          {action && (
            <div className="flex items-center gap-2.5 ml-auto">
              {action}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
