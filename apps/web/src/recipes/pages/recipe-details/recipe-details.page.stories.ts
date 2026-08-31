import { Meta, StoryObj } from '@storybook/angular';
import { RecipeDetailsPage } from './recipe-details.page';

const meta: Meta<RecipeDetailsPage> = {
  title: 'Components/RecipeDetails',
  component: RecipeDetailsPage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<RecipeDetailsPage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-recipe-details></app-recipe-details>`
    };
  }
};
