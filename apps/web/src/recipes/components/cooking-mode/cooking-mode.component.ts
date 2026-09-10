import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { RecipeDetails } from '../../models/recipe-details.types';
import { CookingStagesComponent } from '../cooking-stages/cooking-stages.component';
import { IngredientListComponent } from '../ingredient-list/ingredient-list.component';

@Component({
  selector: 'app-cooking-mode',
  imports: [
    IngredientListComponent,
    CookingStagesComponent,
    TranslocoDirective
  ],
  templateUrl: './cooking-mode.component.html',
  styleUrl: './cooking-mode.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookingModeComponent {
  readonly recipe = input.required<RecipeDetails>();

  readonly servings = input.required<number>();
}
