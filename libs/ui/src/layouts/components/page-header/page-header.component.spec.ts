import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTranslocoModule } from '../../../transloco-testing.module';

import { PageHeaderComponent } from './page-header.component';

@Component({
  imports: [ PageHeaderComponent ],
  template: `
    <ui-page-header [showBackButton]="showBack()" (navigatedBack)="back()">
      <h1>Title</h1>
      <div uiPageHeaderSubtitle>Sub <a href="/x">inner link</a></div>
      <div>unmarked</div>
      <button>Btn</button>
      <a href="/y">Link action</a>
      <span uiPageHeaderAction>Custom</span>
    </ui-page-header>`
})
class HostComponent {
  readonly showBack = signal(false);
  readonly back = jest.fn();
}

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HostComponent,
        getTranslocoModule({ langs: { en: { ui: { PageHeader: { back: 'Back' } } } } })
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('projects the subtitle slot', () => {
    expect(host.querySelector('.subheader')?.textContent).toContain('Sub inner link');
  });

  it('projects buttons, links and marked actions', () => {
    const actions = host.querySelector('.actions')?.textContent ?? '';
    expect(actions).toContain('Btn');
    expect(actions).toContain('Link action');
    expect(actions).toContain('Custom');
    expect(actions).not.toContain('inner link');
  });

  it('drops unmarked divs', () => {
    expect(host.textContent).not.toContain('unmarked');
  });

  it('emits navigatedBack from the back button', async () => {
    fixture.componentInstance.showBack.set(true);
    await fixture.whenStable();
    const button = Array.from(host.querySelectorAll<HTMLButtonElement>('.actions button'))
      .find(b => b.textContent?.includes('arrow_back'));
    button?.click();
    expect(fixture.componentInstance.back).toHaveBeenCalledTimes(1);
  });
});
