import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardStateComponent } from './card-state.component';

describe('CardStateComponent', () => {
  let component: CardStateComponent;
  let fixture: ComponentFixture<CardStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CardStateComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CardStateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
