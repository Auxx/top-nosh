import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { of, take, throwError } from 'rxjs';
import { ConfigurationService } from '../../../system/services/configuration/configuration.service';
import { ThemeManagerService } from './theme-manager.service';
import { THEME_COLOR_SCHEME_STORAGE_KEY, UI_THEME_PALETTE_CONFIG_KEY } from './theme-manager.types';

describe('ThemeManagerService', () => {
  let service: ThemeManagerService;

  let bodyClasses: string[] = [];

  let localStorage: Record<string, string> = {};

  let configurationServiceMock: {
    getConfigurations: jest.Mock;
    updateConfigurations: jest.Mock;
  };

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

    configurationServiceMock = {
      getConfigurations: jest.fn().mockReturnValue(of({})),
      updateConfigurations: jest.fn().mockImplementation(values => of(values))
    };

    TestBed.configureTestingModule({
      providers: [
        ThemeManagerService,
        { provide: DOCUMENT, useValue: documentMock },
        { provide: ConfigurationService, useValue: configurationServiceMock }
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

    it('should initialize with default chartreuse palette when configuration is empty', done => {
      expect(configurationServiceMock.getConfigurations).toHaveBeenCalledWith([ UI_THEME_PALETTE_CONFIG_KEY ]);
      expect(documentMock.body.classList.contains('chartreuse')).toBe(true);

      service.colorPalette().subscribe(palette => {
        expect(palette).toBe('chartreuse');
        done();
      });
    });

    it('should initialize with palette from configuration when valid', done => {
      TestBed.resetTestingModule();
      bodyClasses = [];

      configurationServiceMock.getConfigurations.mockReturnValue(of({ [UI_THEME_PALETTE_CONFIG_KEY]: 'cyan' }));

      TestBed.configureTestingModule({
        providers: [
          ThemeManagerService,
          { provide: DOCUMENT, useValue: documentMock },
          { provide: ConfigurationService, useValue: configurationServiceMock }
        ]
      });

      const customService = TestBed.inject(ThemeManagerService);

      expect(documentMock.body.classList.contains('cyan')).toBe(true);
      expect(documentMock.body.classList.contains('chartreuse')).toBe(false);

      customService.colorPalette().subscribe(palette => {
        expect(palette).toBe('cyan');
        done();
      });
    });

    it('should fall back to chartreuse when configuration call errors', done => {
      TestBed.resetTestingModule();
      bodyClasses = [];

      configurationServiceMock.getConfigurations.mockReturnValue(throwError(() => new Error('API error')));

      TestBed.configureTestingModule({
        providers: [
          ThemeManagerService,
          { provide: DOCUMENT, useValue: documentMock },
          { provide: ConfigurationService, useValue: configurationServiceMock }
        ]
      });

      const customService = TestBed.inject(ThemeManagerService);

      expect(documentMock.body.classList.contains('chartreuse')).toBe(true);

      customService.colorPalette().subscribe(palette => {
        expect(palette).toBe('chartreuse');
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

  describe('resetColorScheme', () => {
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

  describe('switchColorPalette', () => {
    it('should call ConfigurationService updateConfigurations, update body class and subject emission', done => {
      service.switchColorPalette('rose').subscribe(() => {
        expect(configurationServiceMock.updateConfigurations).toHaveBeenCalledWith({
          [UI_THEME_PALETTE_CONFIG_KEY]: 'rose'
        });
        expect(documentMock.body.classList.contains('rose')).toBe(true);
        expect(documentMock.body.classList.contains('chartreuse')).toBe(false);

        service.colorPalette().pipe(take(1)).subscribe(palette => {
          expect(palette).toBe('rose');
          done();
        });
      });
    });

    it('should switch between multiple palettes correctly', done => {
      service.switchColorPalette('red').subscribe(() => {
        expect(documentMock.body.classList.contains('red')).toBe(true);
        expect(documentMock.body.classList.contains('chartreuse')).toBe(false);

        service.switchColorPalette('blue').subscribe(() => {
          expect(documentMock.body.classList.contains('blue')).toBe(true);
          expect(documentMock.body.classList.contains('red')).toBe(false);

          service.colorPalette().pipe(take(1)).subscribe(palette => {
            expect(palette).toBe('blue');
            done();
          });
        });
      });
    });
  });

  describe('previewColorPalette', () => {
    it('should change body class without mutating subject or updating configuration', done => {
      configurationServiceMock.updateConfigurations.mockClear();

      service.previewColorPalette('violet');

      expect(documentMock.body.classList.contains('violet')).toBe(true);
      expect(documentMock.body.classList.contains('chartreuse')).toBe(false);
      expect(configurationServiceMock.updateConfigurations).not.toHaveBeenCalled();

      service.colorPalette().subscribe(palette => {
        expect(palette).toBe('chartreuse');
        done();
      });
    });
  });

  describe('resetColorPalette', () => {
    it('should restore body classes to match current active palette', () => {
      expect(documentMock.body.classList.contains('chartreuse')).toBe(true);

      service.previewColorPalette('magenta');
      expect(documentMock.body.classList.contains('magenta')).toBe(true);
      expect(documentMock.body.classList.contains('chartreuse')).toBe(false);

      service.resetColorPalette();
      expect(documentMock.body.classList.contains('chartreuse')).toBe(true);
      expect(documentMock.body.classList.contains('magenta')).toBe(false);
    });

    it('should restore body classes to updated active palette', done => {
      service.switchColorPalette('yellow').subscribe(() => {
        expect(documentMock.body.classList.contains('yellow')).toBe(true);

        service.previewColorPalette('green');
        expect(documentMock.body.classList.contains('green')).toBe(true);
        expect(documentMock.body.classList.contains('yellow')).toBe(false);

        service.resetColorPalette();
        expect(documentMock.body.classList.contains('yellow')).toBe(true);
        expect(documentMock.body.classList.contains('green')).toBe(false);
        done();
      });
    });
  });
});
