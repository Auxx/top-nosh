import { Meta, StoryObj } from '@storybook/angular';
import { RecipeListItem } from '../../models/recipe-list.types';
import { RecipeGridViewComponent } from './recipe-grid-view.component';

const sampleRecipes: RecipeListItem[] = [
  {
    id: '1',
    name: 'Spaghetti Bolognese',
    cuisine: 'Italian',
    category: 'Pasta',
    description: 'Rich meat sauce with pasta.',
    thumbnail: 'https://placehold.co/400x300'
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    cuisine: 'Italian',
    category: 'Pizza',
    description: 'Classic cheese and tomato pizza.',
    thumbnail: null
  }
];

const meta: Meta<RecipeGridViewComponent> = {
  title: 'Components/RecipeGridView',
  component: RecipeGridViewComponent,
  args: {
    recipes: sampleRecipes
  },
  argTypes: {}
};

export default meta;

type Story = StoryObj<RecipeGridViewComponent>;

export const Default: Story = {
  args: {
    recipes: sampleRecipes
  }
};

export const Empty: Story = {
  args: {
    recipes: []
  }
};
