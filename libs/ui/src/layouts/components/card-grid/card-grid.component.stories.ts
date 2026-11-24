import { MatCardModule } from '@angular/material/card';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { CardGridComponent } from './card-grid.component';

const meta: Meta<CardGridComponent> = {
  title: 'Layouts/CardGrid',
  component: CardGridComponent,
  tags: [ 'autodocs' ],
  decorators: [ moduleMetadata({ imports: [ MatCardModule ] }) ]
};

export default meta;

type Story = StoryObj<CardGridComponent>;

export const TwoCards: Story = {
  render: args => ({
    props: args,
    template: `
      <ui-card-grid>
        <mat-card>
          <mat-card-header><mat-card-title>First card</mat-card-title></mat-card-header>
          <mat-card-content>Content of the first card.</mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Second card</mat-card-title></mat-card-header>
          <mat-card-content>Content of the second card.</mat-card-content>
        </mat-card>
      </ui-card-grid>`
  })
};

export const LongTitle: Story = {
  render: args => ({
    props: args,
    template: `
      <ui-card-grid>
        <mat-card>
          <mat-card-header>
            <mat-card-title>Supercalifragilisticexpialidocious_unbroken_word_sixty_chars</mat-card-title>
          </mat-card-header>
          <mat-card-content>Content of the card.</mat-card-content>
        </mat-card>
      </ui-card-grid>`
  })
};

export const Mobile: Story = {
  ...LongTitle,
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: ({ canvasElement }) => {
    expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth);
  }
};
