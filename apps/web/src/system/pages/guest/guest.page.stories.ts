import { Meta, StoryObj } from '@storybook/angular';
import { GuestPage } from './guest.page';

const meta: Meta<GuestPage> = {
  title: 'Components/Guest',
  component: GuestPage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<GuestPage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-guest></app-guest>`
    };
  }
};
