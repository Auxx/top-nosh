import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { ConfirmationDialog, ConfirmationDialogData } from './confirmation.dialog';

const dialogProviders = (data: ConfirmationDialogData) =>
  applicationConfig({
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close: fn() } }
    ]
  });

const meta: Meta<ConfirmationDialog> = {
  title: 'Dialogs/Confirmation',
  component: ConfirmationDialog,
  tags: [ 'autodocs' ]
};

export default meta;

type Story = StoryObj<ConfirmationDialog>;

export const Default: Story = {
  decorators: [
    dialogProviders({ title: 'Delete recipe?', content: 'This action cannot be undone.' })
  ]
};

export const CustomLabels: Story = {
  decorators: [
    dialogProviders({
      title: 'Delete recipe?',
      content: 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Keep'
    })
  ]
};
