import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
import { ThemeManagerService } from '../../services/theme-manager/theme-manager.service';
import { ThemePage } from './theme.page';

describe('ThemePage', () => {
  let component: ThemePage;
  let fixture: ComponentFixture<ThemePage>;

  let themeManagerMock: {
    colorScheme: jest.Mock;
    resetColorScheme: jest.Mock;
    previewColorScheme: jest.Mock;
    switchColorScheme: jest.Mock;
    colorPalette: jest.Mock;
    resetColorPalette: jest.Mock;
    previewColorPalette: jest.Mock;
    switchColorPalette: jest.Mock;
  };

  let router: {
    navigate: jest.Mock;
  };

  beforeEach(async () => {
    themeManagerMock = {
      colorScheme: jest.fn(() => of('light-dark')),
      resetColorScheme: jest.fn(),
      previewColorScheme: jest.fn(),
      switchColorScheme: jest.fn(),
      colorPalette: jest.fn(() => of('chartreuse')),
      resetColorPalette: jest.fn(),
      previewColorPalette: jest.fn(),
      switchColorPalette: jest.fn(() => of({ 'ui.theme.palette': 'chartreuse' }))
    };

    router = {
      navigate: jest.fn().mockResolvedValue(true)
    };

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

  it('should initialize form with color scheme and color palette from ThemeManagerService', () => {
    expect(themeManagerMock.colorScheme).toHaveBeenCalled();
    expect(themeManagerMock.colorPalette).toHaveBeenCalled();
    expect(component.colorScheme.value).toBe('light-dark');
    expect(component.palette.value).toBe('chartreuse');
  });

  it('should call previewColorScheme on colorScheme value changes', () => {
    component.colorScheme.setValue('dark');
    expect(themeManagerMock.previewColorScheme).toHaveBeenCalledWith('dark');

    component.colorScheme.setValue('light');
    expect(themeManagerMock.previewColorScheme).toHaveBeenCalledWith('light');
  });

  it('should call previewColorPalette on palette value changes', () => {
    component.palette.setValue('violet');
    expect(themeManagerMock.previewColorPalette).toHaveBeenCalledWith('violet');

    component.palette.setValue('rose');
    expect(themeManagerMock.previewColorPalette).toHaveBeenCalledWith('rose');
  });

  it('should switch color scheme, switch color palette, and navigate back to /settings on onSubmit', () => {
    component.colorScheme.setValue('dark');
    component.palette.setValue('rose');
    themeManagerMock.previewColorScheme.mockClear();
    themeManagerMock.previewColorPalette.mockClear();
    themeManagerMock.switchColorPalette.mockReturnValue(of({ 'ui.theme.palette': 'rose' }));

    component.onSubmit();

    expect(themeManagerMock.switchColorScheme).toHaveBeenCalledWith('dark');
    expect(themeManagerMock.switchColorPalette).toHaveBeenCalledWith('rose');
    expect(router.navigate).toHaveBeenCalledWith([ '/settings' ]);
    expect(component.isSubmitting()).toBe(false);
    expect(component.hasError()).toBe(false);
  });

  it('should set hasError to true and isSubmitting to false when switchColorPalette fails on onSubmit', () => {
    component.colorScheme.setValue('dark');
    component.palette.setValue('rose');
    router.navigate.mockClear();
    themeManagerMock.switchColorPalette.mockReturnValue(throwError(() => new Error('Save error')));

    component.onSubmit();

    expect(themeManagerMock.switchColorScheme).toHaveBeenCalledWith('dark');
    expect(themeManagerMock.switchColorPalette).toHaveBeenCalledWith('rose');
    expect(component.hasError()).toBe(true);
    expect(component.isSubmitting()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to /settings on onNavigateBack', () => {
    component.onNavigateBack();
    expect(router.navigate).toHaveBeenCalledWith([ '/settings' ]);
  });

  it('should reset preview on component destroy', () => {
    fixture.destroy();
    expect(themeManagerMock.resetColorScheme).toHaveBeenCalled();
    expect(themeManagerMock.resetColorPalette).toHaveBeenCalled();
  });
});
