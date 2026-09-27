import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, Observable, take } from 'rxjs';
import { allColorSchemes, ColorScheme, THEME_COLOR_SCHEME_STORAGE_KEY } from './theme-manager.types';

@Injectable({ providedIn: 'root' })
export class ThemeManagerService {
  private readonly document = inject(DOCUMENT);

  private readonly localStorage = this.document.defaultView?.localStorage;

  private readonly colorScheme$ = new BehaviorSubject<ColorScheme>('light-dark');

  constructor() {
    this.colorScheme$
      .pipe(distinctUntilChanged())
      .subscribe(colorScheme => {
        this.saveColorScheme(colorScheme);
        this.applyColorScheme(colorScheme);
      });

    this.colorScheme$.next(this.loadColorScheme());
  }

  readonly colorScheme = (): Observable<ColorScheme> => this.colorScheme$.asObservable();

  readonly switchColorScheme = (scheme: ColorScheme) => this.colorScheme$.next(scheme);

  readonly previewColorScheme = (scheme: ColorScheme) => this.applyColorScheme(scheme);

  readonly resetColorScheme = () =>
    this.colorScheme$
      .pipe(take(1))
      .subscribe(scheme => this.applyColorScheme(scheme));

  private applyColorScheme(scheme: ColorScheme): void {
    this.document.body.classList.remove('light', 'dark');

    if (scheme === 'light' || scheme === 'dark') {
      this.document.body.classList.add(scheme);
    }
  }

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

  private readonly saveColorScheme = (scheme: ColorScheme) => {
    try {
      if (this.localStorage !== undefined) {
        localStorage.setItem(THEME_COLOR_SCHEME_STORAGE_KEY, scheme);
      }
    } catch {
      // Ignore storage write errors
    }
  };
}
