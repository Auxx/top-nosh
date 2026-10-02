import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatOption } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatError, MatFormField, MatLabel } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { BlockLoaderComponent, BlockNoticeComponent, PageHeaderComponent, WhenError } from '@top-nosh/ui';
import { take } from 'rxjs';
import { ThemeManagerService } from '../../services/theme-manager/theme-manager.service';
import {
  availableColorSchemes,
  availableThemes,
  ColorScheme,
  Palette
} from '../../services/theme-manager/theme-manager.types';

@Component({
  selector: 'app-theme',
  imports: [
    TranslocoDirective,
    PageHeaderComponent,
    BlockLoaderComponent,
    BlockNoticeComponent,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    FormsModule,
    MatError,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    ReactiveFormsModule,
    WhenError,
    MatIcon,
    MatIconButton
  ],
  templateUrl: './theme.page.html',
  styleUrl: './theme.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemePage {
  private readonly router = inject(Router);
  private readonly themeManager = inject(ThemeManagerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);

  readonly isSubmitting = signal(false);

  readonly hasError = signal(false);

  readonly availableThemes = availableThemes();

  protected readonly availableColorSchemes = availableColorSchemes;

  readonly palette = new FormControl<Palette>('chartreuse', { validators: Validators.required, nonNullable: true });

  readonly colorScheme = new FormControl<ColorScheme>('light-dark', {
    validators: Validators.required,
    nonNullable: true
  });

  readonly form = new FormGroup({
    palette: this.palette,
    colorScheme: this.colorScheme
  });

  constructor() {
    this.themeManager
      .colorScheme()
      .pipe(
        take(1),
        takeUntilDestroyed()
      )
      .subscribe(scheme => this.colorScheme.setValue(scheme, { emitEvent: false }));

    this.colorScheme
      .valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => this.themeManager.previewColorScheme(value));

    this.destroyRef.onDestroy(() => this.themeManager.resetColorScheme());
  }

  readonly onNavigateBack = () => this.router.navigate([ '/settings' ]);

  readonly onSubmit = () => {
    this.themeManager.switchColorScheme(this.colorScheme.value);
    this.router.navigate([ '/settings' ]).then();
  };
}
