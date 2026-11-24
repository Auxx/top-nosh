import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { MarkdownPreviewDialog, MarkdownPreviewDialogData } from './markdown-preview.dialog';

const dialogProviders = (data: MarkdownPreviewDialogData) =>
  applicationConfig({
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close: fn() } }
    ]
  });

const meta: Meta<MarkdownPreviewDialog> = {
  title: 'Dialogs/MarkdownPreview',
  component: MarkdownPreviewDialog,
  tags: [ 'autodocs' ]
};

export default meta;

type Story = StoryObj<MarkdownPreviewDialog>;

export const WithMarkdown: Story = {
  decorators: [
    dialogProviders({
      markdown: [
        '# Pancakes',
        '',
        '## Ingredients',
        '',
        '- 2 cups flour',
        '- 2 eggs',
        '- 1 cup milk',
        '',
        'See the [full recipe](https://example.com/pancakes) for details.'
      ].join('\n')
    })
  ]
};

export const Empty: Story = {
  decorators: [ dialogProviders({ markdown: '' }) ]
};
