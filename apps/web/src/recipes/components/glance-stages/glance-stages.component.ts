import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from '@angular/material/expansion';
import { NoticeComponent, SectionHeaderComponent } from '@top-nosh/ui';
import { RecipeDetails } from '../../models/recipe-details.types';

@Component({
  selector: 'app-glance-stages',
  imports: [
    SectionHeaderComponent,
    MatCard,
    MatCardContent,
    NoticeComponent,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle
  ],
  templateUrl: './glance-stages.component.html',
  styleUrl: './glance-stages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlanceStagesComponent {
  readonly recipe = input.required<RecipeDetails>();
}
