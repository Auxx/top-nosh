import { Meta, StoryObj } from '@storybook/angular';
import { RecipeListItem } from '../../models/recipe-list.types';
import { RecipeTableViewComponent } from './recipe-table-view.component';

const sampleRecipes: RecipeListItem[] = [
  {
    id: '1',
    name: 'Spaghetti Bolognese',
    cuisine: 'Italian',
    category: 'Pasta',
    description: 'Rich meat sauce with pasta.',
    thumbnail: null
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

const desktopColumns = [ 'name', 'description', 'cuisine', 'category', 'actions' ];
const mobileColumns = [ 'name', 'actions' ];

const meta: Meta<RecipeTableViewComponent> = {
  title: 'Components/RecipeTableView',
  component: RecipeTableViewComponent,
  args: {
    recipes: sampleRecipes,
    columns: desktopColumns
  },
  argTypes: {}
};

export default meta;

type Story = StoryObj<RecipeTableViewComponent>;

export const Desktop: Story = {
  args: {
    recipes: sampleRecipes,
    columns: desktopColumns
  }
};

export const Mobile: Story = {
  args: {
    recipes: sampleRecipes,
    columns: mobileColumns
  }
};

export const Empty: Story = {
  args: {
    recipes: [],
    columns: desktopColumns
  }
};
