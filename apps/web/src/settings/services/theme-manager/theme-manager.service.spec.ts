import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs';
import { ThemeManagerService } from './theme-manager.service';
import { THEME_COLOR_SCHEME_STORAGE_KEY } from './theme-manager.types';

describe('ThemeManagerService', () => {
  let service: ThemeManagerService;

  let bodyClasses: string[] = [];

  let localStorage: Record<string, string> = {};

  const documentMock = {
    body: {
      classList: {
        add: (className: string) => bodyClasses.push(className),
        contains: (className: string) => bodyClasses.includes(className),
        remove: (...classNames: string[]) => bodyClasses = bodyClasses.filter(c => !classNames.includes(c))
      }
    },
    defaultView: {
      localStorage: {
        getItem: (key: string) => localStorage[key] ?? null,
        setItem: (key: string, value: string) => localStorage[key] = value
      }
    }
  };

  beforeEach(() => {
    bodyClasses = [];
    localStorage = {};

    TestBed.configureTestingModule({
      providers: [
        ThemeManagerService,
        { provide: DOCUMENT, useValue: documentMock }
      ]
    });

    service = TestBed.inject(ThemeManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default light-dark scheme when localStorage is empty and clear body classes', done => {
      expect(documentMock.body.classList.contains('light')).toBe(false);
      expect(documentMock.body.classList.contains('dark')).toBe(false);

      service.colorScheme().subscribe(scheme => {
        expect(scheme).toBe('light-dark');
        done();
      });
    });
  });

  describe('switchColorScheme', () => {
    it('should update body class, update subject emission', done => {
      service.switchColorScheme('dark');

      service.colorScheme()
        .pipe(take(1))
        .subscribe(scheme => {
          expect(documentMock.body.classList.contains('dark')).toBe(true);
          expect(documentMock.body.classList.contains('light')).toBe(false);
          expect(scheme).toBe('dark');

          done();
        });
    });

    it('should update body class, update subject emission', done => {
      service.switchColorScheme('dark');
      service.switchColorScheme('light');

      service.colorScheme()
        .pipe(take(1))
        .subscribe(scheme => {
          expect(documentMock.body.classList.contains('light')).toBe(true);
          expect(documentMock.body.classList.contains('dark')).toBe(false);
          expect(scheme).toBe('light');

          done();
        });
    });

    it('should remove light and dark classes when switching to light-dark', done => {
      service.switchColorScheme('dark');
      expect(documentMock.body.classList.contains('dark')).toBe(true);

      service.switchColorScheme('light-dark');

      expect(documentMock.body.classList.contains('dark')).toBe(false);
      expect(documentMock.body.classList.contains('light')).toBe(false);

      service.colorScheme().subscribe(scheme => {
        expect(scheme).toBe('light-dark');
        done();
      });
    });
  });

  describe('previewColorScheme', () => {
    it('should change body class without mutating subject or updating localStorage', done => {
      expect(localStorage[THEME_COLOR_SCHEME_STORAGE_KEY]).toBeUndefined();

      service.previewColorScheme('dark');

      expect(documentMock.body.classList.contains('dark')).toBe(true);
      expect(documentMock.body.classList.contains('light')).toBe(false);
      expect(localStorage[THEME_COLOR_SCHEME_STORAGE_KEY]).toBeUndefined();

      service.colorScheme().subscribe(scheme => {
        expect(scheme).toBe('light-dark');
        done();
      });
    });
  });

  describe('resetPreview', () => {
    it('should restore body classes to match current active scheme', () => {
      service.switchColorScheme('dark');
      expect(documentMock.body.classList.contains('dark')).toBe(true);

      service.previewColorScheme('light');
      expect(documentMock.body.classList.contains('light')).toBe(true);
      expect(documentMock.body.classList.contains('dark')).toBe(false);

      service.resetColorScheme();
      expect(documentMock.body.classList.contains('dark')).toBe(true);
      expect(documentMock.body.classList.contains('light')).toBe(false);
    });

    it('should restore body classes to light-dark when active scheme is light-dark', () => {
      service.previewColorScheme('dark');
      expect(documentMock.body.classList.contains('dark')).toBe(true);

      service.resetColorScheme();
      expect(documentMock.body.classList.contains('dark')).toBe(false);
      expect(documentMock.body.classList.contains('light')).toBe(false);
    });
  });
});
