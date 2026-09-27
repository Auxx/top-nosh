import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardIconComponent } from './card-icon.component';

describe('CardIconComponent', () => {
  let component: CardIconComponent;
  let fixture: ComponentFixture<CardIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CardIconComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CardIconComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
