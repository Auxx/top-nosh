import { Meta, StoryObj } from '@storybook/angular';
import { LoginPage } from './login.page';

const meta: Meta<LoginPage> = {
  title: 'Components/Login',
  component: LoginPage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<LoginPage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-login></app-login>`
    };
  }
};
