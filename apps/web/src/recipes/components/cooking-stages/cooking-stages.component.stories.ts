import { Meta, StoryObj } from '@storybook/angular';
import { CookingStagesComponent } from './cooking-stages.component';

const meta: Meta<CookingStagesComponent> = {
  title: 'Components/CookingStages',
  component: CookingStagesComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<CookingStagesComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-cooking-stages></app-cooking-stages>`
    };
  }
};
