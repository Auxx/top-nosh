import { ComponentFixture, TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '../../../transloco-testing.module';
import { CardStateComponent } from './card-state.component';

describe('CardStateComponent', () => {
  let component: CardStateComponent;
  let fixture: ComponentFixture<CardStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CardStateComponent,
        getTranslocoModule({ langs: { en: { ui: { CardState: { loading: 'Loading…' } } } } })
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CardStateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  const host = () => fixture.nativeElement as HTMLElement;

  it('is a polite live region', () => {
    expect(host().getAttribute('aria-live')).toBe('polite');
  });

  it('is busy and labels the spinner while loading', async () => {
    fixture.componentRef.setInput('isLoading', true);
    await fixture.whenStable();
    expect(host().getAttribute('aria-busy')).toBe('true');
    expect(host().querySelector('mat-spinner')?.getAttribute('aria-label')).toBe('Loading…');
  });

  it('announces errors assertively', async () => {
    fixture.componentRef.setInput('errorMessage', 'Boom');
    await fixture.whenStable();
    expect(host().querySelector('p.error-message')?.getAttribute('role')).toBe('alert');
  });

  it('is not busy when idle', () => {
    expect(host().getAttribute('aria-busy')).toBe('false');
  });

  it('marks the host as showing content only when there is no state to show', async () => {
    expect(host().classList).toContain('ui-card-state-content');

    fixture.componentRef.setInput('isLoading', true);
    await fixture.whenStable();
    expect(host().classList).not.toContain('ui-card-state-content');

    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('noticeMessage', 'Nothing here');
    await fixture.whenStable();
    expect(host().classList).not.toContain('ui-card-state-content');

    fixture.componentRef.setInput('noticeMessage', undefined);
    fixture.componentRef.setInput('errorMessage', 'Boom');
    await fixture.whenStable();
    expect(host().classList).not.toContain('ui-card-state-content');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
