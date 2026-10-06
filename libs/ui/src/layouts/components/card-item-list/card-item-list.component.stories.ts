import { Meta, StoryObj } from '@storybook/angular';
import { CardItemListComponent } from './card-item-list.component';

const meta: Meta<CardItemListComponent> = {
  title: 'Components/CardItemList',
  component: CardItemListComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<CardItemListComponent>;

export const Primary: Story = {
  render: props => ({
    props,
    template: `<ui-card-item-list></ui-card-item-list>`
  })
};
