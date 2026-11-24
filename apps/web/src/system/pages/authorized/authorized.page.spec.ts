import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MenuBarComponent } from '@top-nosh/ui';
import { MockComponents } from 'ng-mocks';
import { getTranslocoModule } from '../../transloco-testing.module';

import { AuthorizedPage } from './authorized.page';

describe('AuthorizedPage', () => {
  let component: AuthorizedPage;
  let fixture: ComponentFixture<AuthorizedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AuthorizedPage,
        getTranslocoModule(),
        MockComponents(MenuBarComponent)
      ],
      providers: [ provideRouter([]) ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AuthorizedPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
