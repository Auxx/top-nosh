import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslocoDirective } from '@jsverse/transloco';
import { MiniBadgeComponent, NoticeComponent, ScaleQuantityPipe, SectionHeaderComponent, UnitPipe } from '@top-nosh/ui';
import {
  AddToShoppingListDirective
} from '../../../shopping-lists/directives/add-to-shopping-list/add-to-shopping-list.directive';
import { IngredientDetails, RecipeDetails } from '../../models/recipe-details.types';

@Component({
  selector: 'app-ingredient-list',
  imports: [
    NoticeComponent,
    ScaleQuantityPipe,
    SectionHeaderComponent,
    UnitPipe,
    MatIcon,
    MatIconButton,
    MatTooltip,
    MatMenu,
    AddToShoppingListDirective,
    MatMenuTrigger,
    MiniBadgeComponent,
    MatCheckbox,
    NgTemplateOutlet,
    TranslocoDirective
  ],
  templateUrl: './ingredient-list.component.html',
  styleUrl: './ingredient-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IngredientListComponent {
  readonly recipe = input.required<RecipeDetails>();

  readonly servings = input.required<number>();

  readonly groupByStage = input<boolean>(false);

  readonly selectable = input<boolean>(false);

  readonly showMenu = input<boolean>(false);

  readonly selectedIngredient = signal<IngredientDetails | null>(null);

  readonly allIngredients = computed(() => {
    const recipe = this.recipe();

    if (recipe.stages.length === 0) {
      return [];
    }

    const result: IngredientDetails[] = [];

    recipe.stages
      .flatMap(stage => stage.ingredients || [])
      .forEach(ingredient => {
        const found = result.find(i => i.name === ingredient.name && i.unit === ingredient.unit);

        if (found === undefined) {
          result.push(ingredient);
          return;
        }

        found.quantity += ingredient.quantity;
      });

    return result;
  });

  readonly onAddToShoppingList = (ingredient: IngredientDetails) => this.selectedIngredient.set(ingredient);
}
