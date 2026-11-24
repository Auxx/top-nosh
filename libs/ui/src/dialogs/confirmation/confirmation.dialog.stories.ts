import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Meta, StoryObj } from '@storybook/angular';
import { ConfirmationDialog } from './confirmation.dialog';

const meta: Meta<ConfirmationDialog> = {
  title: 'Dialogs/ConfirmationDialog',
  component: ConfirmationDialog,
  args: {},
  argTypes: {}
};

export default meta;

type Story = StoryObj<ConfirmationDialog>;

export const Primary: Story = {
  render: props => ({
    props,
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          title: 'Confirm Action',
          content: 'Are you sure you want to proceed?',
          confirmText: 'Yes',
          cancelText: 'No'
        }
      },
      {
        provide: MatDialogRef,
        useValue: {
          close: jest.fn()
        }
      }
    ]
  })
};
