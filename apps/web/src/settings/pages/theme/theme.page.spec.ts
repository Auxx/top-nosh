import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
import { ThemeManagerService } from '../../services/theme-manager/theme-manager.service';
import { ColorScheme } from '../../services/theme-manager/theme-manager.types';
import { ThemePage } from './theme.page';

describe('ThemePage', () => {
  let component: ThemePage;
  let fixture: ComponentFixture<ThemePage>;
  let colorScheme$: BehaviorSubject<ColorScheme>;
  let themeManagerMock: {
    getColorScheme: jest.Mock;
    switchColorScheme: jest.Mock;
    previewColorScheme: jest.Mock;
    resetPreview: jest.Mock;
  };
  let router: Router;

  beforeEach(async () => {
    colorScheme$ = new BehaviorSubject<ColorScheme>('light-dark');

    themeManagerMock = {
      getColorScheme: jest.fn().mockImplementation(() => colorScheme$.asObservable()),
      switchColorScheme: jest.fn(),
      previewColorScheme: jest.fn(),
      resetPreview: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        ThemePage,
        getTranslocoModule()
      ],
      providers: [
        provideRouter([]),
        { provide: ThemeManagerService, useValue: themeManagerMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture = TestBed.createComponent(ThemePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have methods declared as arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'onSubmit')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onNavigateBack')).toBe(true);
  });

  it('should initialize form with color scheme from ThemeManagerService', () => {
    expect(themeManagerMock.getColorScheme).toHaveBeenCalled();
    expect(component.colorScheme.value).toBe('light-dark');
  });

  it('should initialize with custom scheme when ThemeManagerService emits dark', async () => {
    colorScheme$.next('dark');

    const darkFixture = TestBed.createComponent(ThemePage);
    const darkComponent = darkFixture.componentInstance;
    darkFixture.detectChanges();

    expect(darkComponent.colorScheme.value).toBe('dark');
  });

  it('should call previewColorScheme on colorScheme value changes', () => {
    component.colorScheme.setValue('dark');
    expect(themeManagerMock.previewColorScheme).toHaveBeenCalledWith('dark');

    component.colorScheme.setValue('light');
    expect(themeManagerMock.previewColorScheme).toHaveBeenCalledWith('light');
  });

  it('should switch color scheme and navigate back to /settings on onSubmit', () => {
    component.colorScheme.setValue('dark');
    themeManagerMock.previewColorScheme.mockClear();

    component.onSubmit();

    expect(themeManagerMock.switchColorScheme).toHaveBeenCalledWith('dark');
    expect(router.navigate).toHaveBeenCalledWith([ '/settings' ]);
  });

  it('should navigate to /settings on onNavigateBack', () => {
    component.onNavigateBack();
    expect(router.navigate).toHaveBeenCalledWith([ '/settings' ]);
  });

  it('should reset preview on component destroy', () => {
    fixture.destroy();
    expect(themeManagerMock.resetPreview).toHaveBeenCalled();
  });
});
