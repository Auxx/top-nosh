import type { Meta, StoryObj } from '@storybook/angular-vite';
import { CardItemListComponent } from './card-item-list.component';

const meta: Meta<CardItemListComponent> = {
  title: 'Layouts/CardItemList',
  component: CardItemListComponent,
  tags: [ 'autodocs' ]
};

export default meta;

type Story = StoryObj<CardItemListComponent>;

export const Links: Story = {
  render: args => ({
    props: args,
    template: `
      <ui-card-item-list>
        <a href="#">Pancakes</a>
        <a href="#">Tomato soup</a>
        <a href="#">Greek salad</a>
      </ui-card-item-list>`
  })
};

export const Mixed: Story = {
  render: args => ({
    props: args,
    template: `
      <ui-card-item-list>
        <a href="#">Pancakes</a>
        <span>Tomato soup (no link)</span>
        <a href="#">Greek salad</a>
        <span>Lemon cake (no link)</span>
      </ui-card-item-list>`
  })
};
