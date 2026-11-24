import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoCardComponent } from './info-card.component';

@Component({
  imports: [ InfoCardComponent ],
  template: `
    <ui-info-card icon="test-icon" [dragAndDrop]="true">
      <section><button type="button">Browse</button></section>
      <aside><input type="file"></aside>
    </ui-info-card>`
})
class HostComponent {}

describe('InfoCardComponent', () => {
  let component: InfoCardComponent;
  let fixture: ComponentFixture<InfoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ InfoCardComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(InfoCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('icon', 'test-icon');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('drag-and-drop mode', () => {
    let host: HTMLElement;

    beforeEach(() => {
      const hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
      host = hostFixture.nativeElement.querySelector('ui-info-card');
    });

    it('does not make the host a button', () => {
      expect(host.hasAttribute('role')).toBe(false);
      expect(host.hasAttribute('tabindex')).toBe(false);
    });

    it('keeps the projected button focusable', () => {
      const button = host.querySelector<HTMLButtonElement>('section button');

      expect(button?.tabIndex).toBeGreaterThanOrEqual(0);
    });

    it('hides the aside slot', () => {
      expect(host.querySelector('aside')?.parentElement?.classList).toContain('hidden');
    });
  });
});
