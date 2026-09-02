import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniBadgeComponent } from './mini-badge.component';

describe('MiniBadgeComponent', () => {
  let component: MiniBadgeComponent;
  let fixture: ComponentFixture<MiniBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MiniBadgeComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MiniBadgeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
