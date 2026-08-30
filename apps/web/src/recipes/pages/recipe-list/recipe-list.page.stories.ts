import { Meta, StoryObj } from '@storybook/angular';
import { RecipeListPage } from './recipe-list.page';

const meta: Meta<RecipeListPage> = {
  title: 'Components/RecipeList',
  component: RecipeListPage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<RecipeListPage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-recipe-list></app-recipe-list>`
    };
  }
};
