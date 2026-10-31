// frontend/src/lib/google-maps.ts

/**
 * พิกัดอ้างอิง: คณะวิศวกรรมศาสตร์ มหาวิทยาลัยขอนแก่น (KKU Faculty of Engineering)
 * ใช้เป็นจุดเริ่มต้นสำหรับการคำนวณระยะทางและการเดินทางของนักศึกษาผู้ขอรับทุน
 */
export const KKU_ENGINEERING_ORIGIN = 'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยขอนแก่น';
export const KKU_ENGINEERING_COORDS = '16.474448,102.823439';

/**
 * สกัดค้นหาข้อความค้นหา (Search Query หรือ Coordinates) จากลิงก์ Google Maps
 */
export function extractMapQuery(input?: string | null): string {
  if (!input || !input.trim()) return KKU_ENGINEERING_ORIGIN;
  const trimmed = input.trim();

  // กรณีเป็น URL ของ Google Maps
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const queryParam = url.searchParams.get('q') || url.searchParams.get('query');
      if (queryParam && queryParam.trim()) return queryParam.trim();

      // กรณี URL รูปแบบ /maps/place/ หรือ /maps/dir/
      const match = trimmed.match(/\/maps\/(?:place|dir)\/([^/@]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1].replace(/\+/g, ' '));
      }

      // ถ้าเป็นลิงก์สั้น เช่น maps.app.goo.gl ให้ส่ง URL เดิมไปเปิด
      return trimmed;
    }
  } catch {
    // ถ้า parse URL ไม่ผ่าน ให้ใช้ข้อความเดิม
  }

  return trimmed || KKU_ENGINEERING_ORIGIN;
}

/**
 * สร้าง Embed URL สำหรับ Google Maps Platform API
 * - หากมี Google Maps API Key จะใช้ Google Maps Embed API v1 (Official)
 * - หากไม่มี Key จะ fallback ไปใช้ Google Maps Iframe Embed มาตรฐาน
 */
export function getGoogleMapsEmbedUrl(
  destination?: string | null,
  options?: {
    apiKey?: string;
    mode?: 'place' | 'directions';
    origin?: string;
  },
): string {
  const apiKey = options?.apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mode = options?.mode || 'place';
  const origin = options?.origin || KKU_ENGINEERING_ORIGIN;
  const rawQuery = extractMapQuery(destination);
  const query = rawQuery && rawQuery.trim() ? rawQuery : KKU_ENGINEERING_ORIGIN;

  // 1. กรณีมี Google Maps Platform API Key (Official Embed API v1)
  if (apiKey) {
    if (mode === 'directions') {
      return `https://www.google.com/maps/embed/v1/directions?key=${encodeURIComponent(apiKey)}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(query)}&mode=driving`;
    }
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&zoom=15`;
  }

  // 2. Fallback Standard Embed (ไม่ต้องใช้ API Key)
  if (mode === 'directions') {
    return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(query)}&output=embed`;
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

/**
 * สร้างลิงก์นำทางภายนอกไปยัง Google Maps
 */
export function getGoogleMapsDirectionsUrl(destination?: string | null, origin = KKU_ENGINEERING_ORIGIN): string {
  const rawQuery = extractMapQuery(destination);
  const query = rawQuery && rawQuery.trim() ? rawQuery : KKU_ENGINEERING_ORIGIN;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(query)}`;
}
