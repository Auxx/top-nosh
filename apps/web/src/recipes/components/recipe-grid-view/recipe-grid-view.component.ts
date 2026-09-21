import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { StripMarkdownPipe, TruncatePipe } from '@top-nosh/ui';
import { RecipeListItem } from '../../models/recipe-list.types';
import { ShareRecipeButtonComponent } from '../share-recipe-button/share-recipe-button.component';

@Component({
  selector: 'app-recipe-grid-view',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    StripMarkdownPipe,
    TruncatePipe,
    TranslocoDirective,
    ShareRecipeButtonComponent
  ],
  templateUrl: './recipe-grid-view.component.html',
  styleUrl: './recipe-grid-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeGridViewComponent {
  readonly recipes = input.required<RecipeListItem[]>();

  readonly edit = output<RecipeListItem>();
  readonly delete = output<RecipeListItem>();

  readonly onEditRecipe = (recipe: RecipeListItem): void => this.edit.emit(recipe);
  readonly onDeleteRecipe = (recipe: RecipeListItem): void => this.delete.emit(recipe);
}
