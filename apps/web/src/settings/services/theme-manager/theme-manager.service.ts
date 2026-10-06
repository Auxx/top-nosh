import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, Observable, take, tap } from 'rxjs';
import {
  ConfigurationService,
  ConfigurationValuesMap
} from '../../../system/services/configuration/configuration.service';
import {
  allColorSchemes,
  allPalettes,
  ColorScheme,
  Palette,
  THEME_COLOR_SCHEME_STORAGE_KEY,
  UI_THEME_PALETTE_CONFIG_KEY
} from './theme-manager.types';

@Injectable({ providedIn: 'root' })
export class ThemeManagerService {
  private readonly document = inject(DOCUMENT);

  private readonly configurationService = inject(ConfigurationService);

  private readonly localStorage = this.document.defaultView?.localStorage;

  private readonly loadColorScheme = (): ColorScheme => {
    try {
      if (this.localStorage !== undefined) {
        const stored = this.localStorage.getItem(THEME_COLOR_SCHEME_STORAGE_KEY);

        if (stored !== null && (allColorSchemes as readonly string[]).includes(stored)) {
          return stored as ColorScheme;
        }
      }
    } catch {
      // Ignore storage read errors
    }
    return 'light-dark';
  };

  private readonly colorScheme$ = new BehaviorSubject<ColorScheme>(this.loadColorScheme());

  private readonly colorPalette$ = new BehaviorSubject<Palette>('chartreuse');

  constructor() {
    this.colorScheme$
      .pipe(distinctUntilChanged())
      .subscribe(colorScheme => {
        this.saveColorScheme(colorScheme);
        this.applyColorScheme(colorScheme);
      });

    this.colorPalette$
      .pipe(distinctUntilChanged())
      .subscribe(palette => {
        this.applyColorPalette(palette);
      });

    this.loadColorPalette();
  }

  readonly colorScheme = (): Observable<ColorScheme> => this.colorScheme$.asObservable();

  readonly switchColorScheme = (scheme: ColorScheme): void => this.colorScheme$.next(scheme);

  readonly previewColorScheme = (scheme: ColorScheme): void => this.applyColorScheme(scheme);

  readonly resetColorScheme = (): void => {
    this.colorScheme$
      .pipe(take(1))
      .subscribe(scheme => this.applyColorScheme(scheme));
  };

  readonly colorPalette = (): Observable<Palette> => this.colorPalette$.asObservable();

  readonly switchColorPalette = (palette: Palette): Observable<ConfigurationValuesMap> =>
    this.configurationService
      .updateConfigurations({ [UI_THEME_PALETTE_CONFIG_KEY]: palette })
      .pipe(
        tap(() => {
          this.colorPalette$.next(palette);
          this.applyColorPalette(palette);
        })
      );

  readonly previewColorPalette = (palette: Palette): void => this.applyColorPalette(palette);

  readonly resetColorPalette = (): void => {
    this.colorPalette$
      .pipe(take(1))
      .subscribe(palette => this.applyColorPalette(palette));
  };

  private readonly loadColorPalette = (): void => {
    this.configurationService
      .getConfigurations([ UI_THEME_PALETTE_CONFIG_KEY ])
      .pipe(take(1))
      .subscribe({
        next: configurations => {
          const palette = configurations[UI_THEME_PALETTE_CONFIG_KEY];
          if (palette && (allPalettes as readonly string[]).includes(palette)) {
            this.colorPalette$.next(palette as Palette);
          }
        },
        error: () => {
          // Fall back gracefully to default palette
        }
      });
  };

  private readonly applyColorScheme = (scheme: ColorScheme): void => {
    this.document.body.classList.remove('light', 'dark');

    if (scheme === 'light' || scheme === 'dark') {
      this.document.body.classList.add(scheme);
    }
  };

  private readonly applyColorPalette = (palette: Palette): void => {
    this.document.body.classList.remove(...allPalettes);
    this.document.body.classList.add(palette);
  };

  private readonly saveColorScheme = (scheme: ColorScheme): void => {
    try {
      if (this.localStorage !== undefined) {
        localStorage.setItem(THEME_COLOR_SCHEME_STORAGE_KEY, scheme);
      }
    } catch {
      // Ignore storage write errors
    }
  };
}
