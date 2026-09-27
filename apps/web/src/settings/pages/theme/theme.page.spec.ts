import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
import { ThemeManagerService } from '../../services/theme-manager/theme-manager.service';
import { ThemePage } from './theme.page';

describe('ThemePage', () => {
  let component: ThemePage;
  let fixture: ComponentFixture<ThemePage>;

  const themeManagerMock = {
    colorScheme: jest.fn(() => of('light-dark')),
    resetColorScheme: jest.fn(),
    previewColorScheme: jest.fn(),
    switchColorScheme: jest.fn()
  };

  const router = {
    navigate: jest.fn().mockResolvedValue(true)
  };

  beforeEach(async () => {
    await TestBed
      .configureTestingModule({
        imports: [
          ThemePage,
          getTranslocoModule()
        ],
        providers: [
          provideRouter([]),
          { provide: ThemeManagerService, useValue: themeManagerMock },
          { provide: Router, useValue: router }
        ]
      })
      .compileComponents();

    fixture = TestBed.createComponent(ThemePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with color scheme from ThemeManagerService', () => {
    expect(themeManagerMock.colorScheme).toHaveBeenCalled();
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
    expect(themeManagerMock.resetColorScheme).toHaveBeenCalled();
  });
});
