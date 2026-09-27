import { Meta, StoryObj } from '@storybook/angular';
import { CardStateComponent } from './card-state.component';

const meta: Meta<CardStateComponent> = {
  title: 'Components/CardState',
  component: CardStateComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<CardStateComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<ui-card-state></ui-card-state>`
    };
  }
};
