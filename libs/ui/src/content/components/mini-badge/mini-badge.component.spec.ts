import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniBadgeComponent } from './mini-badge.component';

describe('MiniBadgeComponent', () => {
  let component: MiniBadgeComponent;
  let fixture: ComponentFixture<MiniBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MiniBadgeComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MiniBadgeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('color', 'primary');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets namespaced colour properties', async () => {
    fixture.componentRef.setInput('color', 'tertiary');
    await fixture.whenStable();

    const style = (fixture.nativeElement as HTMLElement).style;

    expect(style.getPropertyValue('--ui-mini-badge-background')).toBe('var(--mat-sys-tertiary-container)');
    expect(style.getPropertyValue('--ui-mini-badge-foreground')).toBe('var(--mat-sys-on-tertiary-container)');
  });

  it('does not leak generic custom properties', () => {
    const style = (fixture.nativeElement as HTMLElement).style;

    expect(style.getPropertyValue('--background')).toBe('');
    expect(style.getPropertyValue('--foreground')).toBe('');
  });
});
