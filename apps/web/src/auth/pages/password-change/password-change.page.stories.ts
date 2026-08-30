import { Meta, StoryObj } from '@storybook/angular';
import { PasswordChangePage } from './password-change.page';

const meta: Meta<PasswordChangePage> = {
  title: 'Components/PasswordChange',
  component: PasswordChangePage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<PasswordChangePage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-password-change></app-password-change>`
    };
  }
};
