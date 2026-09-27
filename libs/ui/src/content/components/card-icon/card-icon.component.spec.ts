import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatIcon } from '@angular/material/icon';
import { MockComponents } from 'ng-mocks';
import { CardIconComponent } from './card-icon.component';

describe('CardIconComponent', () => {
  let component: CardIconComponent;
  let fixture: ComponentFixture<CardIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CardIconComponent,
        MockComponents(MatIcon)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CardIconComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('icon', 'test');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
