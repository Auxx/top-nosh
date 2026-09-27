import { Meta, StoryObj } from '@storybook/angular';
import { ThemePage } from './theme.page';

const meta: Meta<ThemePage> = {
  title: 'Components/Theme',
  component: ThemePage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<ThemePage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-theme></app-theme>`
    };
  }
};
