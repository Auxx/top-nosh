import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ThemeManagerService } from './theme-manager.service';
import { THEME_COLOR_SCHEME_STORAGE_KEY } from './theme-manager.types';

describe('ThemeManagerService', () => {
  let service: ThemeManagerService;
  let documentMock: Document;

  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
    TestBed.configureTestingModule({
      providers: [ ThemeManagerService ]
    });
    service = TestBed.inject(ThemeManagerService);
    documentMock = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have methods declared as arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(service, 'getColorScheme')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'switchColorScheme')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'previewColorScheme')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'resetPreview')).toBe(true);
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

    it('should load saved dark scheme from localStorage on startup and add dark class', done => {
      localStorage.setItem(THEME_COLOR_SCHEME_STORAGE_KEY, 'dark');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ ThemeManagerService ]
      });
      const newService = TestBed.inject(ThemeManagerService);
      const doc = TestBed.inject(DOCUMENT);

      expect(doc.body.classList.contains('dark')).toBe(true);
      expect(doc.body.classList.contains('light')).toBe(false);

      newService.colorScheme().subscribe(scheme => {
        expect(scheme).toBe('dark');
        done();
      });
    });

    it('should load saved light scheme from localStorage on startup and add light class', done => {
      localStorage.setItem(THEME_COLOR_SCHEME_STORAGE_KEY, 'light');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ ThemeManagerService ]
      });
      const newService = TestBed.inject(ThemeManagerService);
      const doc = TestBed.inject(DOCUMENT);

      expect(doc.body.classList.contains('light')).toBe(true);
      expect(doc.body.classList.contains('dark')).toBe(false);

      newService.colorScheme().subscribe(scheme => {
        expect(scheme).toBe('light');
        done();
      });
    });

    it('should fallback to default light-dark scheme when localStorage has invalid value', done => {
      localStorage.setItem(THEME_COLOR_SCHEME_STORAGE_KEY, 'invalid-scheme');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ ThemeManagerService ]
      });
      const newService = TestBed.inject(ThemeManagerService);
      const doc = TestBed.inject(DOCUMENT);

      expect(doc.body.classList.contains('light')).toBe(false);
      expect(doc.body.classList.contains('dark')).toBe(false);

      newService.colorScheme().subscribe(scheme => {
        expect(scheme).toBe('light-dark');
        done();
      });
    });
  });

  describe('switchColorScheme', () => {
    it('should update body class, update subject emission, and persist to localStorage when switching to dark', done => {
      service.switchColorScheme('dark');

      expect(documentMock.body.classList.contains('dark')).toBe(true);
      expect(documentMock.body.classList.contains('light')).toBe(false);
      expect(localStorage.getItem(THEME_COLOR_SCHEME_STORAGE_KEY)).toBe('dark');

      service.colorScheme().subscribe(scheme => {
        expect(scheme).toBe('dark');
        done();
      });
    });

    it('should update body class, update subject emission, and persist to localStorage when switching to light', done => {
      service.switchColorScheme('dark');
      service.switchColorScheme('light');

      expect(documentMock.body.classList.contains('light')).toBe(true);
      expect(documentMock.body.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem(THEME_COLOR_SCHEME_STORAGE_KEY)).toBe('light');

      service.colorScheme().subscribe(scheme => {
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
      expect(localStorage.getItem(THEME_COLOR_SCHEME_STORAGE_KEY)).toBe('light-dark');

      service.colorScheme().subscribe(scheme => {
        expect(scheme).toBe('light-dark');
        done();
      });
    });
  });

  describe('previewColorScheme', () => {
    it('should change body class without mutating subject or updating localStorage', done => {
      expect(localStorage.getItem(THEME_COLOR_SCHEME_STORAGE_KEY)).toBeNull();

      service.previewColorScheme('dark');

      expect(documentMock.body.classList.contains('dark')).toBe(true);
      expect(documentMock.body.classList.contains('light')).toBe(false);
      expect(localStorage.getItem(THEME_COLOR_SCHEME_STORAGE_KEY)).toBeNull();

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
