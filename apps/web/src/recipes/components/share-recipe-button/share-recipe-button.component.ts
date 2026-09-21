import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective } from '@jsverse/transloco';
import { buildRecipeShareUrl } from './share-recipe-button.helpers';

@Component({
  selector: 'app-share-recipe-button',
  imports: [ MatButtonModule, MatIconModule, MatTooltipModule, TranslocoDirective ],
  templateUrl: './share-recipe-button.component.html',
  styleUrl: './share-recipe-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShareRecipeButtonComponent {
  readonly recipeId = input.required<string>();

  readonly isIcon = input<boolean>(true);

  readonly shareUrl = computed(() => buildRecipeShareUrl(this.recipeId()));

  readonly copyShareLink = async (): Promise<void> => {
    const url = this.shareUrl();

    if (url && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };
}
