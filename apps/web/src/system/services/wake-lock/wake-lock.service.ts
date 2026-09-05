import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WakeLockService {
  private sentinel: WakeLockSentinel | null = null;

  readonly acquire = async (): Promise<boolean> => {
    if (this.sentinel && !this.sentinel.released) {
      return true;
    }

    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      const sentinel = await navigator.wakeLock.request('screen');
      this.sentinel = sentinel;
      sentinel.addEventListener('release', () => {
        if (this.sentinel === sentinel) {
          this.sentinel = null;
        }
      });
      return true;
    } catch {
      return false;
    }
  };

  readonly release = async (): Promise<boolean> => {
    if (!this.sentinel) {
      return true;
    }

    try {
      const sentinel = this.sentinel;
      this.sentinel = null;
      if (!sentinel.released) {
        await sentinel.release();
      }
      return true;
    } catch {
      this.sentinel = null;
      return false;
    }
  };
}
