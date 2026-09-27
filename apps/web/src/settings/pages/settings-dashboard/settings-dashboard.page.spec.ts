import { ComponentFixture, TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '../../../system/transloco-testing.module';
import { SettingsDashboardPage } from './settings-dashboard.page';

describe('SettingsDashboardPage', () => {
  let component: SettingsDashboardPage;
  let fixture: ComponentFixture<SettingsDashboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SettingsDashboardPage,
        getTranslocoModule()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SettingsDashboardPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
