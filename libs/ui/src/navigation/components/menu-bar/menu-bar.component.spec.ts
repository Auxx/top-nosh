import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { getTranslocoModule } from '../../../transloco-testing.module';
import { MenuBarComponent, MenuItem } from './menu-bar.component';

@Component({ selector: 'ui-dummy', template: '' })
class DummyComponent {}

describe('MenuBarComponent', () => {
  let fixture: ComponentFixture<MenuBarComponent>;
  let element: HTMLElement;

  const items: MenuItem[] = [
    { url: '/recipes', label: 'Recipes' },
    { url: '/settings', label: 'Settings' },
    { url: '/logout', label: 'Log out', icon: 'logout' }
  ];

  const toolbarLinks = (): HTMLAnchorElement[] => Array.from(element.querySelectorAll('mat-toolbar a'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MenuBarComponent,
        getTranslocoModule({
          langs: { en: { ui: { MenuBar: { more: 'More', navigation: 'Main navigation' } } } }
        })
      ],
      providers: [ provideRouter([ { path: '**', component: DummyComponent } ]) ]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuBarComponent);
    fixture.componentRef.setInput('title', 'Top Nosh');
    fixture.componentRef.setInput('items', items);
    element = fixture.nativeElement;
    await TestBed.inject(Router).navigateByUrl('/recipes/42');
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders the title', () => {
    expect(element.querySelector('mat-toolbar')?.textContent).toContain('Top Nosh');
  });

  it('wraps the toolbar in a labelled nav', () => {
    const nav = element.querySelector('nav[aria-label="Main navigation"]');
    expect(nav).not.toBeNull();
    expect(nav?.querySelector('mat-toolbar')).not.toBeNull();
  });

  it('renders every item as a link', () => {
    expect(toolbarLinks().map(a => a.getAttribute('href'))).toEqual([ '/recipes', '/settings', '/logout' ]);
  });

  it('renders text items as plain links, not buttons', () => {
    const textLinks = toolbarLinks().filter(a => a.classList.contains('nav-link'));
    expect(textLinks.map(a => a.getAttribute('href'))).toEqual([ '/recipes', '/settings' ]);
    textLinks.forEach(a => expect(a.classList).not.toContain('mat-mdc-button-base'));
  });

  it('labels icon-only links', () => {
    const logout = toolbarLinks().find(a => a.getAttribute('href') === '/logout');
    expect(logout?.getAttribute('aria-label')).toBe('Log out');
    expect(logout?.textContent?.trim()).toBe('logout');
  });

  it('marks the active section', () => {
    const [ recipes, settings ] = toolbarLinks();
    expect(recipes.classList).toContain('selected');
    expect(recipes.getAttribute('aria-current')).toBe('page');
    expect(settings.classList).not.toContain('selected');
    expect(settings.hasAttribute('aria-current')).toBe(false);
  });

  it('renders the same items as links in the mobile menu', async () => {
    element.querySelector<HTMLElement>('button[aria-label="More"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const menuItems = document.querySelectorAll('.mat-mdc-menu-panel a.mat-mdc-menu-item');
    expect(menuItems.length).toBe(3);
    expect(menuItems[0].getAttribute('aria-current')).toBe('page');
    expect(menuItems[2].querySelector('mat-icon')).not.toBeNull();
  });
});
