import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardItemListComponent } from './card-item-list.component';

describe('CardItemListComponent', () => {
  let component: CardItemListComponent;
  let fixture: ComponentFixture<CardItemListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CardItemListComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CardItemListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
