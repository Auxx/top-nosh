import { TestBed } from '@angular/core/testing';
import { WakeLockService } from './wake-lock.service';

class MockWakeLockSentinel {
  released = false;
  private readonly listeners: Record<string, ((event: Event) => void)[]> = {};

  readonly addEventListener = jest.fn((event: string, callback: (event: Event) => void) => {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  });

  readonly removeEventListener = jest.fn((event: string, callback: (event: Event) => void) => {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  });

  readonly release = jest.fn(async (): Promise<void> => {
    this.released = true;
    this.emit('release');
  });

  readonly emit = (event: string): void => {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(new Event(event)));
    }
  };
}

describe('WakeLockService', () => {
  let service: WakeLockService;
  let mockRequest: jest.Mock;
  let originalWakeLock: unknown;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ WakeLockService ]
    });
    service = TestBed.inject(WakeLockService);

    originalWakeLock = (navigator as unknown as { wakeLock?: unknown; }).wakeLock;
    mockRequest = jest.fn();
    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: mockRequest
      },
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    if (originalWakeLock === undefined) {
      delete (navigator as unknown as { wakeLock?: unknown; }).wakeLock;
    } else {
      Object.defineProperty(navigator, 'wakeLock', {
        value: originalWakeLock,
        configurable: true,
        writable: true
      });
    }
    jest.restoreAllMocks();
  });

  describe('acquire', () => {
    it('should acquire screen wake lock and return true when supported', async () => {
      const sentinel = new MockWakeLockSentinel();
      mockRequest.mockResolvedValue(sentinel);

      const result = await service.acquire();

      expect(result).toBe(true);
      expect(mockRequest).toHaveBeenCalledWith('screen');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    it('should be idempotent and not request a duplicate lock if already active', async () => {
      const sentinel = new MockWakeLockSentinel();
      mockRequest.mockResolvedValue(sentinel);

      const first = await service.acquire();
      const second = await service.acquire();

      expect(first).toBe(true);
      expect(second).toBe(true);
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    it('should re-acquire lock if previous sentinel was released', async () => {
      const sentinel1 = new MockWakeLockSentinel();
      const sentinel2 = new MockWakeLockSentinel();
      mockRequest.mockResolvedValueOnce(sentinel1).mockResolvedValueOnce(sentinel2);

      await service.acquire();
      sentinel1.released = true;

      const second = await service.acquire();

      expect(second).toBe(true);
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });

    it('should return false when wakeLock API is not in navigator', async () => {
      delete (navigator as unknown as { wakeLock?: unknown; }).wakeLock;

      const result = await service.acquire();

      expect(result).toBe(false);
      expect(mockRequest).not.toHaveBeenCalled();
    });

    it('should return false and handle errors gracefully when request rejects', async () => {
      mockRequest.mockRejectedValue(new Error('NotAllowedError: Wake lock permission denied'));

      const result = await service.acquire();

      expect(result).toBe(false);
      expect(mockRequest).toHaveBeenCalledWith('screen');
    });
  });

  describe('release', () => {
    it('should return true when no wake lock is held', async () => {
      const result = await service.release();

      expect(result).toBe(true);
    });

    it('should release active sentinel and return true', async () => {
      const sentinel = new MockWakeLockSentinel();
      mockRequest.mockResolvedValue(sentinel);

      await service.acquire();
      const result = await service.release();

      expect(result).toBe(true);
      expect(sentinel.release).toHaveBeenCalledTimes(1);
    });

    it('should clear cached sentinel so next acquire requests a new lock', async () => {
      const sentinel1 = new MockWakeLockSentinel();
      const sentinel2 = new MockWakeLockSentinel();
      mockRequest.mockResolvedValueOnce(sentinel1).mockResolvedValueOnce(sentinel2);

      await service.acquire();
      await service.release();
      await service.acquire();

      expect(mockRequest).toHaveBeenCalledTimes(2);
    });

    it('should handle release rejection gracefully and return false', async () => {
      const sentinel = new MockWakeLockSentinel();
      sentinel.release = jest.fn().mockRejectedValue(new Error('Release failed'));
      mockRequest.mockResolvedValue(sentinel);

      await service.acquire();
      const result = await service.release();

      expect(result).toBe(false);
    });
  });

  describe('event listener', () => {
    it('should reset internal sentinel reference when release event is emitted by browser', async () => {
      const sentinel1 = new MockWakeLockSentinel();
      const sentinel2 = new MockWakeLockSentinel();
      mockRequest.mockResolvedValueOnce(sentinel1).mockResolvedValueOnce(sentinel2);

      await service.acquire();
      expect(sentinel1.addEventListener).toHaveBeenCalledWith('release', expect.any(Function));

      // Trigger release event externally (e.g. OS sleep or tab visibility change)
      sentinel1.emit('release');

      // Subsequent acquire should request a new lock
      const second = await service.acquire();
      expect(second).toBe(true);
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });
  });
});
