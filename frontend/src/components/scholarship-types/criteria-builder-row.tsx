'use client';

import React from 'react';
import { Trash2, MessageSquare, Award, FileText } from 'lucide-react';
import { NestedSubCriteriaItem } from '@/types/scholarship-type';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CriteriaBuilderRowProps {
  index: number;
  item: NestedSubCriteriaItem;
  onChange: (updated: NestedSubCriteriaItem) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function CriteriaBuilderRow({
  index,
  item,
  onChange,
  onDelete,
  canDelete,
}: CriteriaBuilderRowProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-background/50 hover:bg-muted/30 transition-all">
      {/* Index indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-7 h-7 rounded-lg bg-muted text-muted-foreground font-mono font-bold text-xs flex items-center justify-center border border-border/60">
          {index + 1}
        </span>
      </div>

      {/* Title Input */}
      <div className="flex-1 w-full min-w-[200px]">
        <Input
          value={item.title}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
          placeholder="ชื่อหัวข้อเกณฑ์ย่อย (เช่น ผลการเรียน, จิตอาสา, ความจำเป็นทางการเงิน)"
          className="h-10 text-sm"
        />
      </div>

      {/* Type Selector */}
      <div className="w-full md:w-44 shrink-0">
        <Select
          value={item.type}
          onChange={(e) => onChange({ ...item, type: e.target.value as 'SCORED' | 'TEXT' })}
          className="h-10 text-xs"
        >
          <option value="SCORED">🎯 มีคะแนน (SCORED)</option>
          <option value="TEXT">📝 ข้อความ (TEXT)</option>
        </Select>
      </div>

      {/* Allow Comment Switch */}
      <div className="flex items-center gap-2 shrink-0">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none px-2.5 py-1.5 rounded-lg border border-border/60 bg-card hover:bg-muted/50 text-xs text-foreground font-medium transition">
          <input
            type="checkbox"
            checked={Boolean(item.allowComment)}
            onChange={(e) => onChange({ ...item, allowComment: e.target.checked })}
            className="rounded border-border text-primary focus:ring-primary/20 h-4 w-4"
          />
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <span>อนุญาตบันทึกความเห็น</span>
        </label>
      </div>

      {/* Delete Action */}
      <div className="shrink-0 self-end md:self-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={!canDelete}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
          title={canDelete ? 'ลบหัวข้อนี้' : 'ต้องมีเกณฑ์อย่างน้อย 1 ข้อ'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
