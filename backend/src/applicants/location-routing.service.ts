import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoundStatus } from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';

export const KKU_ENGINEERING_ORIGIN = 'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยขอนแก่น';
export const KKU_ENGINEERING_COORDS = {
  lat: 16.474448,
  lng: 102.823439,
};

export interface TravelDistanceResponse {
  available: boolean;
  message?: string;
  origin?: {
    name: string;
    lat: number;
    lng: number;
  };
  destination?: {
    title?: string;
    lat: number;
    lng: number;
  };
  distanceKm?: number;
  distanceMeters?: number;
  durationMinutes?: number;
  durationSeconds?: number;
  routeSummary?: string;
  provider?: string;
}

interface CacheEntry {
  data: TravelDistanceResponse;
  cachedAt: number;
}

@Injectable()
export class LocationRoutingService {
  private readonly logger = new Logger(LocationRoutingService.name);

  // In-Memory Cache เพื่อลดการยิงซ้ำซ้อนไปยัง OSRM Server ภายนอก
  private readonly cache = new Map<number, CacheEntry>();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง
  private readonly MAX_CACHE_ENTRIES = 500;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * อ่านข้อมูลจาก In-Memory Cache
   */
  private getFromCache(applicantId: number): TravelDistanceResponse | null {
    const entry = this.cache.get(applicantId);
    if (!entry) return null;

    const isExpired = Date.now() - entry.cachedAt > this.CACHE_TTL_MS;
    if (isExpired) {
      this.cache.delete(applicantId);
      return null;
    }

    return entry.data;
  }

  /**
   * บันทึกข้อมูลลง In-Memory Cache พร้อมป้องกัน Memory Overfill
   */
  private setCache(applicantId: number, data: TravelDistanceResponse): void {
    if (this.cache.size >= this.MAX_CACHE_ENTRIES) {
      // ลบรายการแรกสุดออก (FIFO eviction)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(applicantId, {
      data,
      cachedAt: Date.now(),
    });
  }

  /**
   * ล้าง Cache (ใช้สำหรับทดสอบหรือเมื่อมีการอัปเดตข้อมูลที่พัก)
   */
  clearCache(applicantId?: number): void {
    if (applicantId !== undefined) {
      this.cache.delete(applicantId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * สกัดพิกัด (Latitude, Longitude) จาก URL ของ Google Maps หรือข้อความ
   */
  extractCoordinates(
    input?: string | null,
  ): { lat: number; lng: number } | null {
    if (!input || !input.trim()) return null;
    const text = input.trim();

    try {
      // 1. ตรวจสอบ query parameters เช่น q=16.474448,102.823439 หรือ ll=...
      if (text.startsWith('http://') || text.startsWith('https://')) {
        const parsedUrl = new URL(text);
        const query =
          parsedUrl.searchParams.get('q') ||
          parsedUrl.searchParams.get('query') ||
          parsedUrl.searchParams.get('ll') ||
          parsedUrl.searchParams.get('daddr');

        if (query) {
          const match = query.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
          if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            if (this.isValidCoords(lat, lng)) {
              return { lat, lng };
            }
          }
        }

        // 2. ตรวจสอบ path เช่น /@16.474448,102.823439,15z
        const pathMatch = text.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
        if (pathMatch) {
          const lat = parseFloat(pathMatch[1]);
          const lng = parseFloat(pathMatch[2]);
          if (this.isValidCoords(lat, lng)) {
            return { lat, lng };
          }
        }
      }
    } catch {
      // Ignore URL parsing errors and try direct regex
    }

    // 3. ค้นหาพิกัดโดยตรงจากข้อความ (เช่น "16.474448, 102.823439")
    const match = text.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (this.isValidCoords(lat, lng)) {
        return { lat, lng };
      }
    }

    return null;
  }

  private isValidCoords(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * ค้นหาพิกัดปลายทาง: พยายามสกัดจาก URL/ข้อความ หรือเรียก OpenStreetMap Nominatim API
   */
  async resolveCoordinates(
    mapUrl?: string | null,
    addressText?: string | null,
  ): Promise<{ lat: number; lng: number; title?: string } | null> {
    // ลองสกัดจาก mapUrl ก่อน
    const fromMapUrl = this.extractCoordinates(mapUrl);
    if (fromMapUrl) {
      return { ...fromMapUrl, title: addressText || undefined };
    }

    // กรณีเป็น short link (เช่น maps.app.goo.gl) ให้ลอง resolve redirect
    if (mapUrl && (mapUrl.includes('goo.gl') || mapUrl.includes('maps.app'))) {
      try {
        const response = await fetch(mapUrl, {
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(3000),
        });
        const finalUrl = response.url;
        const fromRedirect = this.extractCoordinates(finalUrl);
        if (fromRedirect) {
          return { ...fromRedirect, title: addressText || undefined };
        }
      } catch (err) {
        this.logger.debug(`Could not follow redirect for ${mapUrl}: ${err}`);
      }
    }

    // ลองสกัดจากที่อยู่ข้อความ
    const fromAddress = this.extractCoordinates(addressText);
    if (fromAddress) {
      return { ...fromAddress, title: addressText || undefined };
    }

    // หากยังไม่พบพิกัด และมีข้อความที่อยู่ ให้เรียก Nominatim (OpenStreetMap Geocoding API)
    if (addressText && addressText.trim().length > 3) {
      try {
        const query = encodeURIComponent(`${addressText.trim()} ขอนแก่น`);
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
        const res = await fetch(nominatimUrl, {
          headers: {
            'User-Agent':
              'SEMS-KKU-Scholarship-System/1.0 (Faculty of Engineering, Khon Kaen University)',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(3500),
        });

        if (res.ok) {
          const data = (await res.json()) as Array<{
            lat: string;
            lon: string;
            display_name: string;
          }>;
          if (Array.isArray(data) && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            if (this.isValidCoords(lat, lng)) {
              return {
                lat,
                lng,
                title: data[0].display_name,
              };
            }
          }
        }
      } catch (err) {
        this.logger.debug(`Nominatim geocoding failed: ${err}`);
      }
    }

    return null;
  }

  /**
   * คำนวณระยะทางและเวลาเดินทางจากคณะวิศวะฯ มข. ไปยังที่พักผู้สมัคร โดยเรียก OSRM Routing API (Open Source)
   * พร้อมระบบ In-Memory Cache เพื่อความรวดเร็วและป้องกัน Rate Limit
   */
  async calculateTravelDistance(
    applicantId: number,
    userRole?: string,
  ): Promise<TravelDistanceResponse> {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        round: { select: { status: true } },
        supportingInfo: {
          select: {
            accommodation: true,
            accommodationMapUrl: true,
          },
        },
      },
    });

    if (!applicant) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // IDOR / Security check: ถ้าเป็น Evaluator อนุญาตเฉพาะรอบ OPEN
    if (
      userRole === 'EVALUATOR' &&
      applicant.round.status !== RoundStatus.OPEN
    ) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // ตรวจสอบ Cache ก่อนคำนวณใหม่ (Cache Hit)
    const cached = this.getFromCache(applicantId);
    if (cached) {
      return cached;
    }

    const supporting = applicant.supportingInfo;
    if (!supporting?.accommodationMapUrl && !supporting?.accommodation) {
      return {
        available: false,
        message: 'ผู้สมัครไม่ได้ระบุข้อมูลที่พักอาศัยหรือลิงก์แผนที่',
      };
    }

    const destCoords = await this.resolveCoordinates(
      supporting.accommodationMapUrl,
      supporting.accommodation,
    );

    if (!destCoords) {
      return {
        available: false,
        message: 'ไม่สามารถระบุพิกัดตำแหน่งที่พักอาศัยได้จากข้อมูลที่ให้ไว้',
      };
    }

    // เรียก OSRM Routing Machine API (Open Source Free API)
    // Format: /route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false
    const originLng = KKU_ENGINEERING_COORDS.lng;
    const originLat = KKU_ENGINEERING_COORDS.lat;
    const destLng = destCoords.lng;
    const destLat = destCoords.lat;

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;

    try {
      const response = await fetch(osrmUrl, {
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        this.logger.warn(`OSRM API responded with status ${response.status}`);
        return {
          available: false,
          message:
            'บริการคำนวณเส้นทางภายนอก (OSRM) ไม่สามารถตอบสนองได้ในขณะนี้',
        };
      }

      const data = (await response.json()) as {
        code: string;
        routes?: Array<{ distance: number; duration: number }>;
      };

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Number((route.distance / 1000).toFixed(1));
        const durationMinutes = Math.max(1, Math.round(route.duration / 60));

        const result: TravelDistanceResponse = {
          available: true,
          origin: {
            name: KKU_ENGINEERING_ORIGIN,
            lat: originLat,
            lng: originLng,
          },
          destination: {
            title:
              destCoords.title ||
              supporting.accommodation ||
              'ที่พักอาศัยของผู้สมัคร',
            lat: destLat,
            lng: destLng,
          },
          distanceKm,
          distanceMeters: Math.round(route.distance),
          durationMinutes,
          durationSeconds: Math.round(route.duration),
          routeSummary: `ระยะทางขับขี่ ${distanceKm} กม. (~${durationMinutes} นาที)`,
          provider: 'OSRM (Open Source Routing Machine)',
        };

        // บันทึกลง In-Memory Cache
        this.setCache(applicantId, result);

        return result;
      }

      return {
        available: false,
        message: 'ไม่พบเส้นทางสำหรับพิกัดนี้บนโครงข่ายถนน',
      };
    } catch (error) {
      this.logger.error(`Error fetching route from OSRM: ${error}`);
      return {
        available: false,
        message:
          'ไม่สามารถเชื่อมต่อบริการคำนวณเส้นทางภายนอก (OSRM) ได้ในขณะนี้',
      };
    }
  }
}
