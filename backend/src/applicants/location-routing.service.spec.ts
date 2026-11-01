import { Test, TestingModule } from '@nestjs/testing';
import {
  LocationRoutingService,
  KKU_ENGINEERING_COORDS,
  KKU_ENGINEERING_ORIGIN,
} from './location-routing.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoundStatus } from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';

describe('LocationRoutingService', () => {
  let service: LocationRoutingService;
  let prisma: {
    applicant: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      applicant: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationRoutingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<LocationRoutingService>(LocationRoutingService);
    service.clearCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('extractCoordinates', () => {
    it('should extract coordinates from standard google maps query url', () => {
      const url = 'https://www.google.com/maps?q=16.478950,102.825630';
      const coords = service.extractCoordinates(url);
      expect(coords).toEqual({ lat: 16.47895, lng: 102.82563 });
    });

    it('should extract coordinates from @lat,lng path url', () => {
      const url =
        'https://www.google.com/maps/place/Dorm/@16.481234,102.812345,15z';
      const coords = service.extractCoordinates(url);
      expect(coords).toEqual({ lat: 16.481234, lng: 102.812345 });
    });

    it('should extract coordinates from plain text string with lat,lng', () => {
      const text = '16.474448, 102.823439';
      const coords = service.extractCoordinates(text);
      expect(coords).toEqual({ lat: 16.474448, lng: 102.823439 });
    });

    it('should return null for invalid or empty inputs', () => {
      expect(service.extractCoordinates(null)).toBeNull();
      expect(service.extractCoordinates('')).toBeNull();
      expect(service.extractCoordinates('หอพักนักศึกษา มข.')).toBeNull();
    });
  });

  describe('calculateTravelDistance', () => {
    it('should throw 404 if applicant is not found', async () => {
      prisma.applicant.findUnique.mockResolvedValue(null);

      await expect(
        service.calculateTravelDistance(999, 'ADMIN'),
      ).rejects.toThrow(AppException);
    });

    it('should throw 404 for evaluator if round is not OPEN', async () => {
      prisma.applicant.findUnique.mockResolvedValue({
        id: 1,
        round: { status: RoundStatus.CLOSED },
        supportingInfo: {
          accommodationMapUrl: 'https://maps.google.com?q=16.48,102.82',
        },
      });

      await expect(
        service.calculateTravelDistance(1, 'EVALUATOR'),
      ).rejects.toThrow(AppException);
    });

    it('should return available: false if no accommodation info', async () => {
      prisma.applicant.findUnique.mockResolvedValue({
        id: 1,
        round: { status: RoundStatus.OPEN },
        supportingInfo: null,
      });

      const res = await service.calculateTravelDistance(1, 'ADMIN');
      expect(res.available).toBe(false);
      expect(res.message).toContain('ไม่ได้ระบุข้อมูลที่พักอาศัย');
    });

    it('should calculate distance successfully when OSRM responds with valid route', async () => {
      prisma.applicant.findUnique.mockResolvedValue({
        id: 1,
        round: { status: RoundStatus.OPEN },
        supportingInfo: {
          accommodation: 'หอพักกัลปพฤกษ์',
          accommodationMapUrl:
            'https://www.google.com/maps?q=16.485000,102.815000',
        },
      });

      // Mock global fetch for OSRM
      const mockOsrmResponse = {
        code: 'Ok',
        routes: [
          {
            distance: 4250, // 4.25 km -> 4.3 km
            duration: 540, // 9 minutes
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockOsrmResponse),
      });

      const res = await service.calculateTravelDistance(1, 'EVALUATOR');

      expect(res.available).toBe(true);
      expect(res.origin?.name).toBe(KKU_ENGINEERING_ORIGIN);
      expect(res.origin?.lat).toBe(KKU_ENGINEERING_COORDS.lat);
      expect(res.destination?.lat).toBe(16.485);
      expect(res.destination?.lng).toBe(102.815);
      expect(res.distanceKm).toBe(4.3);
      expect(res.durationMinutes).toBe(9);
      expect(res.provider).toContain('OSRM');
    });

    it('should return cached result on second call without fetching OSRM again (Cache Hit)', async () => {
      prisma.applicant.findUnique.mockResolvedValue({
        id: 10,
        round: { status: RoundStatus.OPEN },
        supportingInfo: {
          accommodationMapUrl:
            'https://www.google.com/maps?q=16.485000,102.815000',
        },
      });

      const mockOsrmResponse = {
        code: 'Ok',
        routes: [{ distance: 5000, duration: 600 }],
      };

      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockOsrmResponse),
      });
      global.fetch = fetchMock;

      // First call -> hits fetch
      const first = await service.calculateTravelDistance(10, 'ADMIN');
      expect(first.distanceKm).toBe(5);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second call -> returns from cache, fetch NOT called again
      const second = await service.calculateTravelDistance(10, 'ADMIN');
      expect(second.distanceKm).toBe(5);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should fetch fresh data after cache is cleared', async () => {
      prisma.applicant.findUnique.mockResolvedValue({
        id: 11,
        round: { status: RoundStatus.OPEN },
        supportingInfo: {
          accommodationMapUrl:
            'https://www.google.com/maps?q=16.485000,102.815000',
        },
      });

      const mockOsrmResponse = {
        code: 'Ok',
        routes: [{ distance: 3000, duration: 360 }],
      };

      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockOsrmResponse),
      });
      global.fetch = fetchMock;

      await service.calculateTravelDistance(11, 'ADMIN');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Clear cache for this applicant
      service.clearCache(11);

      // Next call should fetch again
      await service.calculateTravelDistance(11, 'ADMIN');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should handle OSRM error gracefully without crashing', async () => {
      prisma.applicant.findUnique.mockResolvedValue({
        id: 1,
        round: { status: RoundStatus.OPEN },
        supportingInfo: {
          accommodationMapUrl:
            'https://www.google.com/maps?q=16.485000,102.815000',
        },
      });

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const res = await service.calculateTravelDistance(1, 'ADMIN');
      expect(res.available).toBe(false);
      expect(res.message).toContain('ไม่สามารถเชื่อมต่อบริการคำนวณเส้นทาง');
    });
  });
});
