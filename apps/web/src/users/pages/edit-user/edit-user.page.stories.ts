import { Meta, StoryObj } from '@storybook/angular';
import { EditUserPage } from './edit-user.page';

const meta: Meta<EditUserPage> = {
  title: 'Components/EditUser',
  component: EditUserPage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<EditUserPage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-edit-user></app-edit-user>`
    };
  }
};
