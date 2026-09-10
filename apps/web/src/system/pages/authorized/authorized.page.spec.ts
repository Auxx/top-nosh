import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MenuBarComponent } from '@top-nosh/ui';
import { MockComponents } from 'ng-mocks';

import { AuthorizedPage } from './authorized.page';

describe('AuthorizedPage', () => {
  let component: AuthorizedPage;
  let fixture: ComponentFixture<AuthorizedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AuthorizedPage,
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
