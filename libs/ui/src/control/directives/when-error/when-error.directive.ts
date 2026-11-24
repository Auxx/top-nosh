import {
  Directive,
  effect,
  EmbeddedViewRef,
  inject,
  input,
  TemplateRef,
  untracked,
  ViewContainerRef
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { startWith } from 'rxjs';

export interface WhenErrorContext {
  $implicit: string;
  error: string;
}

@Directive({
  selector: '[uiWhenError]'
})
export class WhenErrorDirective {
  static ngTemplateContextGuard(_dir: WhenErrorDirective, _ctx: unknown): _ctx is WhenErrorContext {
    return true;
  }

  private readonly viewContainer = inject(ViewContainerRef);

  private readonly templateRef = inject<TemplateRef<WhenErrorContext>>(TemplateRef);

  readonly uiWhenError = input.required<AbstractControl>();

  readonly uiWhenErrorErrorCode = input.required<string>();

  private viewRef?: EmbeddedViewRef<WhenErrorContext>;

  constructor() {
    effect(onCleanup => {
      const control = this.uiWhenError();
      const errorCode = this.uiWhenErrorErrorCode();

      const sub = control.events.pipe(startWith(null)).subscribe(() => {
        untracked(() => this.render(control, errorCode));
      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  private render(control: AbstractControl, errorCode: string): void {
    if (control.invalid && (control.touched || control.dirty) && control.hasError(errorCode)) {
      if (this.viewRef === undefined || this.viewRef.context.error !== errorCode) {
        this.viewContainer.clear();
        this.viewRef = this.viewContainer.createEmbeddedView(this.templateRef, {
          $implicit: errorCode,
          error: errorCode
        });
      }

      return;
    }

    this.viewContainer.clear();
    this.viewRef = undefined;
  }
}
