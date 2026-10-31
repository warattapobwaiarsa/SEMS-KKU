// frontend/src/lib/google-maps.spec.ts
import { describe, it, expect } from 'vitest';
import {
  extractMapQuery,
  getGoogleMapsEmbedUrl,
  getGoogleMapsDirectionsUrl,
  KKU_ENGINEERING_ORIGIN,
} from './google-maps';

describe('google-maps utility', () => {
  describe('extractMapQuery', () => {
    it('returns default origin when input is empty', () => {
      expect(extractMapQuery('')).toBe(KKU_ENGINEERING_ORIGIN);
    });

    it('extracts q parameter from Google Maps search URL', () => {
      const url = 'https://www.google.com/maps?q=16.4744,102.8234';
      expect(extractMapQuery(url)).toBe('16.4744,102.8234');
    });

    it('extracts place name from Google Maps place URL', () => {
      const url = 'https://www.google.com/maps/place/Khon+Kaen+University/@16.47,102.82,15z';
      expect(extractMapQuery(url)).toBe('Khon Kaen University');
    });

    it('returns raw text when input is a place or address name', () => {
      expect(extractMapQuery('หอพักกังสดาล มข.')).toBe('หอพักกังสดาล มข.');
    });
  });

  describe('getGoogleMapsEmbedUrl', () => {
    it('generates standard embed URL when API key is omitted', () => {
      const embedUrl = getGoogleMapsEmbedUrl('หอพักกังสดาล');
      expect(embedUrl).toContain('maps.google.com/maps?q=');
      expect(embedUrl).toContain('output=embed');
    });

    it('generates official Google Maps Platform API v1 URL when API key is provided', () => {
      const embedUrl = getGoogleMapsEmbedUrl('หอพักกังสดาล', {
        apiKey: 'AIzaSyFakeKey123',
        mode: 'place',
      });
      expect(embedUrl).toContain('google.com/maps/embed/v1/place');
      expect(embedUrl).toContain('key=AIzaSyFakeKey123');
      expect(embedUrl).toContain('q=');
    });

    it('generates directions embed URL when mode is directions with API key', () => {
      const embedUrl = getGoogleMapsEmbedUrl('หอพักกังสดาล', {
        apiKey: 'AIzaSyFakeKey123',
        mode: 'directions',
      });
      expect(embedUrl).toContain('google.com/maps/embed/v1/directions');
      expect(embedUrl).toContain('mode=driving');
    });
  });

  describe('getGoogleMapsDirectionsUrl', () => {
    it('generates external navigation URL with origin and destination', () => {
      const dirUrl = getGoogleMapsDirectionsUrl('หอพักกังสดาล');
      expect(dirUrl).toContain('google.com/maps/dir/?api=1');
      expect(dirUrl).toContain('destination=');
    });
  });
});
