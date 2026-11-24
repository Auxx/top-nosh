import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { getTranslocoModule } from '../../../transloco-testing.module';
import { MenuBarComponent } from './menu-bar.component';

describe('MenuBarComponent', () => {
  let component: MenuBarComponent;
  let fixture: ComponentFixture<MenuBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MenuBarComponent,
        getTranslocoModule({
          langs: {
            en: {
              ui: {
                MenuBar: {
                  logout: 'Log out',
                  more: 'More',
                  dashboard: 'Dashboard',
                  recipes: 'Recipes',
                  shoppingLists: 'Shopping Lists',
                  settings: 'Settings'
                }
              }
            }
          }
        })
      ],
      providers: [ provideRouter([]) ]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should label every icon-only button', () => {
    const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const iconOnly = buttons.filter(b =>
      (b.textContent ?? '').trim() === (b.querySelector('mat-icon')?.textContent ?? '').trim()
    );
    expect(iconOnly.length).toBe(2);
    expect(iconOnly.map(b => b.getAttribute('aria-label'))).toEqual([ 'Log out', 'More' ]);
  });

  it('should not set an unsupported size attribute on icons', () => {
    expect(fixture.nativeElement.querySelector('mat-icon[size]')).toBeNull();
  });
});
