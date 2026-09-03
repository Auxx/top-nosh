import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponents } from 'ng-mocks';
import { CookingStagesComponent } from '../cooking-stages/cooking-stages.component';
import { IngredientListComponent } from '../ingredient-list/ingredient-list.component';

import { CookingModeComponent } from './cooking-mode.component';

describe('CookingModeComponent', () => {
  let component: CookingModeComponent;
  let fixture: ComponentFixture<CookingModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CookingModeComponent,
        MockComponents(
          IngredientListComponent,
          CookingStagesComponent
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CookingModeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', {});
    fixture.componentRef.setInput('servings', 1);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
