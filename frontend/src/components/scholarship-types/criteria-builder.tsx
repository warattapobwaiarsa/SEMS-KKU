'use client';

import React from 'react';
import { Plus, Sliders, Info, Award, FileText, CheckCircle2 } from 'lucide-react';
import { NestedSubCriteriaItem } from '@/types/scholarship-type';
import { CriteriaBuilderRow } from './criteria-builder-row';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

interface CriteriaBuilderProps {
  scholarshipTypeName: string;
  criteriaName: string;
  onCriteriaNameChange: (name: string) => void;
  subCriteria: NestedSubCriteriaItem[];
  onSubCriteriaChange: (items: NestedSubCriteriaItem[]) => void;
}

export function CriteriaBuilder({
  scholarshipTypeName,
  criteriaName,
  onCriteriaNameChange,
  subCriteria,
  onSubCriteriaChange,
}: CriteriaBuilderProps) {
  const handleItemChange = (index: number, updatedItem: NestedSubCriteriaItem) => {
    const updated = [...subCriteria];
    updated[index] = updatedItem;
    onSubCriteriaChange(updated);
  };

  const handleAddItem = () => {
    const newItem: NestedSubCriteriaItem = {
      title: '',
      type: 'SCORED',
      allowComment: true,
      sortOrder: subCriteria.length + 1,
    };
    onSubCriteriaChange([...subCriteria, newItem]);
  };

  const handleDeleteItem = (index: number) => {
    if (subCriteria.length <= 1) return;
    const filtered = subCriteria.filter((_, idx) => idx !== index);
    // re-index sortOrder
    const reordered = filtered.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));
    onSubCriteriaChange(reordered);
  };

  const scoredCount = subCriteria.filter((item) => item.type === 'SCORED').length;
  const textCount = subCriteria.filter((item) => item.type === 'TEXT').length;

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="p-5 pb-4 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">
                โครงสร้างเกณฑ์การประเมิน
              </CardTitle>
            </div>
            <CardDescription>
              กำหนดหัวข้อเกณฑ์ประเมินเริ่มต้นสำหรับประเภททุน: <span className="font-semibold text-foreground">{scholarshipTypeName || 'ประเภททุนใหม่'}</span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs font-normal">
              ทั้งหมด {subCriteria.length} ข้อ
            </Badge>
            <Badge variant="secondary" className="text-xs font-normal">
              คะแนน {scoredCount} ข้อ
            </Badge>
            {textCount > 0 && (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                ข้อความ {textCount} ข้อ
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Notice on flexible criteria */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">ระบบประเมินแบบยืดหยุ่น: </span>
            ไม่มีการกำหนดเพดานคะแนน (MaxScore) และไม่จำกัดผลรวมคะแนน 100 คะแนนอีกต่อไป กรรมการสามารถให้คะแนนเกณฑ์แต่ละข้อได้อย่างอิสระตามความเหมาะสมของประเภททุน
          </div>
        </div>

        {/* List of subcriteria rows */}
        <div className="space-y-2.5">
          {subCriteria.map((item, index) => (
            <CriteriaBuilderRow
              key={index}
              index={index}
              item={item}
              onChange={(updated) => handleItemChange(index, updated)}
              onDelete={() => handleDeleteItem(index)}
              canDelete={subCriteria.length > 1}
            />
          ))}
        </div>

        {/* Add more row button */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            className="w-full border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 text-xs sm:text-sm py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มหัวข้อเกณฑ์ย่อยใหม่</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
