import { Meta, StoryObj } from '@storybook/angular';
import { AuthorizedPage } from './authorized.page';

const meta: Meta<AuthorizedPage> = {
  title: 'Components/Authorized',
  component: AuthorizedPage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<AuthorizedPage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-authorized></app-authorized>`
    };
  }
};
