import { Meta, StoryObj } from '@storybook/angular';
import { LogoutPage } from './logout.page';

const meta: Meta<LogoutPage> = {
  title: 'Components/Logout',
  component: LogoutPage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<LogoutPage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-logout></app-logout>`
    };
  }
};
