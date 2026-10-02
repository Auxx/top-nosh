import { Meta, StoryObj } from '@storybook/angular';
import { CardGridComponent } from './card-grid.component';

const meta: Meta<CardGridComponent> = {
  title: 'Components/CardGrid',
  component: CardGridComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<CardGridComponent>;

export const Primary: Story = {
  render: props => ({
    props,
    template: `<ui-card-grid></ui-card-grid>`
  })
};
