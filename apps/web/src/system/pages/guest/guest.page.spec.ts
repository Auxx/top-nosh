import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestPage } from './guest.page';

describe('GuestPage', () => {
  let component: GuestPage;
  let fixture: ComponentFixture<GuestPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ GuestPage ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GuestPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
