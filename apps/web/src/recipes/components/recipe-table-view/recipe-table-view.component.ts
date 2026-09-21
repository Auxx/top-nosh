import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { StripMarkdownPipe, TruncatePipe } from '@top-nosh/ui';
import { RecipeListItem } from '../../models/recipe-list.types';
import { ShareRecipeButtonComponent } from '../share-recipe-button/share-recipe-button.component';

@Component({
  selector: 'app-recipe-table-view',
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    StripMarkdownPipe,
    TruncatePipe,
    TranslocoDirective,
    ShareRecipeButtonComponent
  ],
  templateUrl: './recipe-table-view.component.html',
  styleUrl: './recipe-table-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeTableViewComponent {
  readonly recipes = input.required<RecipeListItem[]>();
  readonly columns = input.required<string[]>();

  readonly edit = output<RecipeListItem>();
  readonly delete = output<RecipeListItem>();

  readonly onEditRecipe = (recipe: RecipeListItem): void => this.edit.emit(recipe);
  readonly onDeleteRecipe = (recipe: RecipeListItem): void => this.delete.emit(recipe);
}
