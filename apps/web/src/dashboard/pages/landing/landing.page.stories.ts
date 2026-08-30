import { Meta, StoryObj } from '@storybook/angular';
import { LandingPage } from './landing.page';

const meta: Meta<LandingPage> = {
  title: 'Components/Landing',
  component: LandingPage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<LandingPage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-landing></app-landing>`
    };
  }
};
