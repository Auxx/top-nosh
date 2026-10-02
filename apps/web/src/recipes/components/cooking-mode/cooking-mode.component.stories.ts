import { Meta, StoryObj } from '@storybook/angular';
import { CookingModeComponent } from './cooking-mode.component';

const meta: Meta<CookingModeComponent> = {
  title: 'Components/CookingMode',
  component: CookingModeComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<CookingModeComponent>;

export const Primary: Story = {
  render: props => ({
    props,
    template: `<app-cooking-mode></app-cooking-mode>`
  })
};
