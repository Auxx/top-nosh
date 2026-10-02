import { Meta, StoryObj } from '@storybook/angular';
import { UserListPage } from './user-list.page';

const meta: Meta<UserListPage> = {
  title: 'Components/UserList',
  component: UserListPage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<UserListPage>;

export const Primary: Story = {
  render: props => ({
    props,
    template: `<app-user-list></app-user-list>`
  })
};
