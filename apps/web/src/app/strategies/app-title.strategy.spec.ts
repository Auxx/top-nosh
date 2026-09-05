import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { AppTitleStrategy } from './app-title.strategy';

describe('AppTitleStrategy', () => {
  let strategy: AppTitleStrategy;
  let titleService: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ AppTitleStrategy, Title ]
    });

    strategy = TestBed.inject(AppTitleStrategy);
    titleService = TestBed.inject(Title);
    jest.spyOn(titleService, 'setTitle');
  });

  it('should set title with "Top Nosh - " prefix when route title is present', () => {
    jest.spyOn(strategy, 'buildTitle').mockReturnValue('Dashboard');
    const mockSnapshot = {} as RouterStateSnapshot;

    strategy.updateTitle(mockSnapshot);

    expect(titleService.setTitle).toHaveBeenCalledWith('Top Nosh - Dashboard');
  });

  it('should set title to "Top Nosh" when route title is empty or undefined', () => {
    jest.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);
    const mockSnapshot = {} as RouterStateSnapshot;

    strategy.updateTitle(mockSnapshot);

    expect(titleService.setTitle).toHaveBeenCalledWith('Top Nosh');
  });
});
