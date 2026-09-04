import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RecipeDetails } from '../../models/recipe-details.types';
import { GlanceStagesComponent } from '../glance-stages/glance-stages.component';
import { IngredientListComponent } from '../ingredient-list/ingredient-list.component';

@Component({
  selector: 'app-glance',
  imports: [
    IngredientListComponent,
    GlanceStagesComponent
  ],
  templateUrl: './glance.component.html',
  styleUrl: './glance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlanceComponent {
  readonly recipe = input.required<RecipeDetails>();

  readonly servings = input.required<number>();

  readonly disableShoppingLists = input<boolean>(false);
}
