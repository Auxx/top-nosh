import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookingModeComponent } from './cooking-mode.component';

describe('CookingModeComponent', () => {
  let component: CookingModeComponent;
  let fixture: ComponentFixture<CookingModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CookingModeComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CookingModeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
