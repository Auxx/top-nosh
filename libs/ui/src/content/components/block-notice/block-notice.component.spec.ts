import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatIcon } from '@angular/material/icon';
import { MockComponents } from 'ng-mocks';
import { BlockNoticeComponent } from './block-notice.component';

@Component({
  imports: [ BlockNoticeComponent ],
  template: `<ui-block-notice icon="info">Nothing here yet</ui-block-notice>`
})
class HostComponent {}

describe('BlockNoticeComponent', () => {
  let component: BlockNoticeComponent;
  let fixture: ComponentFixture<BlockNoticeComponent>;

  beforeEach(async () => {
    await TestBed
      .configureTestingModule({
        imports: [
          BlockNoticeComponent,
          HostComponent,
          MockComponents(MatIcon)
        ]
      })
      .compileComponents();

    fixture = TestBed.createComponent(BlockNoticeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('icon', 'icon');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('is a status region by default', () => {
    expect((fixture.nativeElement as HTMLElement).getAttribute('role')).toBe('status');
  });

  it('is an alert when isError', async () => {
    fixture.componentRef.setInput('isError', true);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).getAttribute('role')).toBe('alert');
  });

  it('should render only the icon and the projected content', async () => {
    const host = TestBed.createComponent(HostComponent);
    await host.whenStable();
    const text = (host.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Nothing here yet');
    expect(text).not.toContain('index.ts');
  });
});
