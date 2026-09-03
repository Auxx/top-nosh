import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MiniBadgeComponent, NoticeComponent, SectionHeaderComponent } from '@top-nosh/ui';
import { MockComponents, MockDirectives } from 'ng-mocks';
import {
  AddToShoppingListDirective
} from '../../../shopping-lists/directives/add-to-shopping-list/add-to-shopping-list.directive';

import { IngredientListComponent } from './ingredient-list.component';

describe('IngredientListComponent', () => {
  let component: IngredientListComponent;
  let fixture: ComponentFixture<IngredientListComponent>;

  const recipe = {
    stages: [],
    servings: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IngredientListComponent,
        MockComponents(
          MatMenu,
          NoticeComponent,
          SectionHeaderComponent,
          MiniBadgeComponent
        ),
        MockDirectives(
          MatMenuTrigger,
          AddToShoppingListDirective
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(IngredientListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', recipe);
    fixture.componentRef.setInput('servings', 1);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
