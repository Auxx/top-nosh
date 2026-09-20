import { Meta, StoryObj } from '@storybook/angular';
import { ImportRecipeDialogComponent } from './import-recipe-dialog.component';

const meta: Meta<ImportRecipeDialogComponent> = {
  title: 'Components/ImportRecipeDialog',
  component: ImportRecipeDialogComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<ImportRecipeDialogComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-import-recipe-dialog></app-import-recipe-dialog>`
    };
  }
};
