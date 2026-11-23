import React from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, Inbox, ArrowRight } from 'lucide-react';
import { Button, Input, EmptyState, Card } from '@/components/ui';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  actionButtonLabel?: string;
  searchPlaceholder?: string;
  relatedLinks?: { label: string; href: string }[];
}

export function PlaceholderPage({
  title,
  subtitle,
  actionButtonLabel,
  searchPlaceholder = 'ค้นหาข้อมูลในตาราง...',
  relatedLinks,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Page Title & Action Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{subtitle}</p>
        </div>

        {actionButtonLabel && (
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            size="md"
          >
            {actionButtonLabel}
          </Button>
        )}
      </div>

      {/* Enterprise Filter & Search Toolbar */}
      <Card className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder={searchPlaceholder}
            readOnly
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Filter className="w-4 h-4 text-muted-foreground" />}
          >
            ตัวกรอง
          </Button>
        </div>
      </Card>

      {/* Main Content Area (Unified Empty State) */}
      <div className="bg-card border border-border/80 rounded-2xl p-10 sm:p-14 shadow-xs text-center flex flex-col items-center justify-center min-h-[380px]">
        <EmptyState
          icon={Inbox}
          title="ยังไม่พบข้อมูลในระบบ"
          description="ระบบพร้อมสำหรับการเชื่อมต่อข้อมูล เมื่อมีการบันทึกหรือนำเข้าข้อมูล รายการจะแสดงผลที่นี่"
        />

        {relatedLinks && relatedLinks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border/60 w-full max-w-md">
            <span className="text-xs font-semibold text-muted-foreground block mb-3 uppercase tracking-wider">
              เมนูที่เกี่ยวข้อง
            </span>
            <div className="flex flex-wrap justify-center gap-2.5">
              {relatedLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="outline"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
