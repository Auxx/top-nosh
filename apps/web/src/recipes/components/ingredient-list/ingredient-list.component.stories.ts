import { Meta, StoryObj } from '@storybook/angular';
import { IngredientListComponent } from './ingredient-list.component';

const meta: Meta<IngredientListComponent> = {
  title: 'Components/IngredientList',
  component: IngredientListComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<IngredientListComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-ingredient-list></app-ingredient-list>`
    };
  }
};
