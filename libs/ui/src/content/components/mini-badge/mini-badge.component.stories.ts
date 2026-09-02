import { Meta, StoryObj } from '@storybook/angular';
import { MiniBadgeComponent } from './mini-badge.component';

const meta: Meta<MiniBadgeComponent> = {
  title: 'Components/MiniBadge',
  component: MiniBadgeComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<MiniBadgeComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<ui-mini-badge></ui-mini-badge>`
    };
  }
};
