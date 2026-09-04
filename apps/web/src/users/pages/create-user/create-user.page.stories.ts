import { Meta, StoryObj } from '@storybook/angular';
import { CreateUserPage } from './create-user.page';

const meta: Meta<CreateUserPage> = {
  title: 'Components/CreateUser',
  component: CreateUserPage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<CreateUserPage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-create-user></app-create-user>`
    };
  }
};
