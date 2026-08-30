import {
  DestroyRef,
  Directive,
  effect,
  EmbeddedViewRef,
  inject,
  input,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

export interface WhenErrorContext<T = unknown> {
  $implicit: T;
  error: T;
}

@Directive({
  selector: '[uiWhenError]',
  standalone: true
})
export class WhenError {
  private readonly destroyRef = inject(DestroyRef);

  private readonly viewContainer = inject(ViewContainerRef);

  private readonly templateRef = inject(TemplateRef<WhenErrorContext>);

  readonly uiWhenError = input.required<AbstractControl>();

  readonly uiWhenErrorErrorCode = input.required<string>();

  private viewRef?: EmbeddedViewRef<WhenErrorContext>;

  private controlSub?: Subscription;

  constructor() {
    effect(() => {
      const control = this.uiWhenError();
      const errorCode = this.uiWhenErrorErrorCode();

      this.controlSub?.unsubscribe();

      this.controlSub = control.statusChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (control.invalid && (control.touched || control.dirty)) {
            if (control.hasError(errorCode)) {
              if (this.viewRef === undefined) {
                this.viewContainer.clear();
                this.viewRef = this.viewContainer.createEmbeddedView(this.templateRef, { error: errorCode });
              }

              return;
            }
          }

          this.viewRef = undefined;
          this.viewContainer.clear();
        });
    });
  }
}
