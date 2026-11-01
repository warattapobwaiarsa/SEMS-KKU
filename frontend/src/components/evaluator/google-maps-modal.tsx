'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, X, Car, Clock } from 'lucide-react';
import {
  getGoogleMapsEmbedUrl,
  getGoogleMapsDirectionsUrl,
  KKU_ENGINEERING_ORIGIN,
} from '@/lib/google-maps';
import type { TravelDistanceInfo } from '@/types/evaluation';

interface GoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  applicantName?: string;
  accommodationTitle?: string;
  travelInfo?: TravelDistanceInfo | null;
  isLoadingTravel?: boolean;
}

export function GoogleMapsModal({
  isOpen,
  onClose,
  destination,
  applicantName,
  accommodationTitle,
  travelInfo,
  isLoadingTravel,
}: GoogleMapsModalProps) {
  const [mode, setMode] = useState<'place' | 'directions'>('place');

  if (!isOpen) return null;

  const embedUrl = getGoogleMapsEmbedUrl(destination, { mode });
  const externalDirectionsUrl = getGoogleMapsDirectionsUrl(destination);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                แผนที่ตำแหน่งที่พักอาศัย (Google Maps)
              </h3>
              {applicantName && (
                <p className="text-xs text-muted-foreground">
                  ผู้สมัคร: {applicantName} {accommodationTitle ? `• ${accommodationTitle}` : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector & Origin Info */}
        <div className="px-5 py-3 bg-background border-b border-border/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl">
            <button
              onClick={() => setMode('place')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                mode === 'place'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ตำแหน่งที่พัก
            </button>
            <button
              onClick={() => setMode('directions')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'directions'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>เส้นทางจาก มข.</span>
            </button>
          </div>

          <div className="text-muted-foreground flex items-center gap-1">
            <span>จุดอ้างอิง:</span>
            <span className="font-medium text-foreground">{KKU_ENGINEERING_ORIGIN}</span>
          </div>
        </div>

        {/* Travel Distance & Route Info Bar */}
        {isLoadingTravel ? (
          <div className="px-5 py-2.5 bg-primary/5 border-b border-primary/20 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
            <span>กำลังคำนวณระยะทางจากคณะวิศวะฯ มข. ...</span>
          </div>
        ) : travelInfo?.available ? (
          <div className="px-5 py-3 bg-primary/5 border-b border-primary/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-foreground font-mono">
                    {travelInfo.distanceKm} กม.
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>เดินทางประมาณ {travelInfo.durationMinutes} นาที</span>
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  จาก <span className="font-medium text-foreground">{travelInfo.origin?.name || KKU_ENGINEERING_ORIGIN}</span> ถึง{' '}
                  <span className="font-medium text-foreground">{travelInfo.destination?.title || accommodationTitle || 'ที่พักอาศัย'}</span>
                </p>
              </div>
            </div>
          </div>
        ) : travelInfo?.message ? (
          <div className="px-5 py-2.5 bg-muted/20 border-b border-border/60 text-xs text-muted-foreground flex items-center justify-between">
            <span>ℹ️ {travelInfo.message}</span>
            <span className="text-[11px] text-muted-foreground/80">จุดอ้างอิง: {KKU_ENGINEERING_ORIGIN}</span>
          </div>
        ) : null}

        {/* Map Container */}
        <div className="relative flex-1 min-h-[350px] sm:min-h-[420px] bg-muted/40">
          <iframe
            title="Google Maps"
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full min-h-[350px] sm:min-h-[420px]"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
          <a
            href={externalDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิดนำทางใน Google Maps เต็มหน้าจอ</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
