import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MenuBarComponent } from './menu-bar.component';

describe('MenuBarComponent', () => {
  let component: MenuBarComponent;
  let fixture: ComponentFixture<MenuBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MenuBarComponent ],
      providers: [ provideRouter([]) ]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have recipes link pointing to /recipes', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[routerLink="/recipes"]');
    expect(link).toBeTruthy();
    expect(link.textContent?.trim()).toBe('Recipes');
  });
});
