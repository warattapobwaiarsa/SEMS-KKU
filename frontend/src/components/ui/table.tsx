import React from 'react';
import { cn } from '@/lib/utils';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export function Table({
  className,
  containerClassName,
  children,
  ...props
}: TableProps) {
  return (
    <div className={cn('relative w-full overflow-x-auto', containerClassName)}>
      <table
        className={cn('w-full caption-bottom text-sm text-left border-collapse', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('bg-muted/60 text-muted-foreground border-b border-border/80 font-medium', className)}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn('divide-y divide-border/60 bg-card text-foreground', className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted/60',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-11 px-4 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('p-4 align-middle text-sm text-foreground', className)}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableCaption({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn('mt-3 text-xs text-muted-foreground', className)}
      {...props}
    >
      {children}
    </caption>
  );
}
