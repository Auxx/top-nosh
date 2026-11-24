import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { WhenError } from './when-error.directive';

let initialControl: AbstractControl;

function invalidControl(): FormControl {
  return new FormControl('', [ Validators.required, Validators.email ]);
}

@Component({
  imports: [ WhenError ],
  template: `<span class="err" *uiWhenError="control(); errorCode: code(); let e">{{ e }}</span>`
})
class HostComponent {
  readonly control = signal<AbstractControl>(initialControl ?? invalidControl());

  readonly code = signal('required');
}

@Component({
  imports: [ WhenError ],
  template:
    `<span class="err" *uiWhenError="control(); errorCode: code(); let e; let err = error">{{ e }}/{{ err }}</span>`
})
class ContextHostComponent {
  readonly control = signal<AbstractControl>(invalidControl());

  readonly code = signal('required');
}

@Component({
  imports: [ WhenError ],
  template:
    `<span class="err req" *uiWhenError="c; errorCode: 'required'">req</span><span class="err mail" *uiWhenError="c; errorCode: 'email'">mail</span>`
})
class TwoCodesHostComponent {
  readonly c = invalidControl();
}

describe('WhenError', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const errors = (): NodeListOf<HTMLElement> => fixture.nativeElement.querySelectorAll('.err');
  const settle = (): Promise<void> => fixture.whenStable();

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    await settle();
  }

  beforeEach(() => {
    initialControl = undefined as unknown as AbstractControl;
  });

  it('renders nothing for an untouched pristine invalid control', async () => {
    await create();

    expect(errors().length).toBe(0);
  });

  it('renders after markAsTouched without a value change', async () => {
    await create();
    host.control().markAsTouched();
    await settle();

    expect(errors().length).toBe(1);
    expect(errors()[0].textContent).toBe('required');
  });

  it('renders after markAllAsTouched on the parent group', async () => {
    await create();
    const ctrl = invalidControl();
    const group = new FormGroup({ c: ctrl });
    host.control.set(ctrl);
    await settle();
    group.markAllAsTouched();
    await settle();

    expect(errors().length).toBe(1);
  });

  it('renders on creation when the control is already touched and invalid', async () => {
    initialControl = invalidControl();
    initialControl.markAsTouched();
    await create();

    expect(errors().length).toBe(1);
  });

  it('switches between error codes as the value changes', async () => {
    const twoFixture = TestBed.createComponent(TwoCodesHostComponent);
    await twoFixture.whenStable();
    const c = twoFixture.componentInstance.c;
    c.setValue('abc');
    c.markAsDirty();
    await twoFixture.whenStable();
    const el: HTMLElement = twoFixture.nativeElement;

    expect(el.querySelector('.req')).toBeNull();
    expect(el.querySelector('.mail')).not.toBeNull();
  });

  it('hides when the control becomes valid', async () => {
    await create();
    host.control().markAsTouched();
    await settle();

    expect(errors().length).toBe(1);

    (host.control() as FormControl).setValue('a@b.co');
    await settle();

    expect(errors().length).toBe(0);
  });

  it('exposes the error code as $implicit and error', async () => {
    const ctxFixture = TestBed.createComponent(ContextHostComponent);
    ctxFixture.componentInstance.control().markAsTouched();
    await ctxFixture.whenStable();

    expect(ctxFixture.nativeElement.querySelector('.err').textContent).toBe('required/required');
  });

  it('ignores the previous control after the input changes', async () => {
    await create();
    const oldCtrl = host.control();
    const newCtrl = invalidControl();
    host.control.set(newCtrl);
    await settle();
    oldCtrl.markAsTouched();
    await settle();

    expect(errors().length).toBe(0);
  });

  it('does not create a second view on repeated events', async () => {
    await create();
    const ctrl = host.control() as FormControl;
    ctrl.markAsTouched();
    await settle();
    ctrl.setValue('');
    ctrl.setValue('');
    await settle();

    expect(errors().length).toBe(1);
  });
});
