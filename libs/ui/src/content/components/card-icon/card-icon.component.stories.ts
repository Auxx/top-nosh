import { Meta, StoryObj } from '@storybook/angular';
import { CardIconComponent } from './card-icon.component';

const meta: Meta<CardIconComponent> = {
  title: 'Components/CardIcon',
  component: CardIconComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<CardIconComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<ui-card-icon></ui-card-icon>`
    };
  }
};
