import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MiniBadgeComponent, NoticeComponent, SectionHeaderComponent } from '@top-nosh/ui';
import { RecipeDetails } from '../../models/recipe-details.types';

@Component({
  selector: 'app-cooking-stages',
  imports: [
    SectionHeaderComponent,
    MatCard,
    MatCardContent,
    NoticeComponent,
    MatCardHeader,
    MatCardTitle,
    MiniBadgeComponent,
    MatCheckbox
  ],
  templateUrl: './cooking-stages.component.html',
  styleUrl: './cooking-stages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookingStagesComponent {
  readonly recipe = input.required<RecipeDetails>();
}
