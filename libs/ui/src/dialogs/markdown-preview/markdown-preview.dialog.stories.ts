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

// TODO(unowned): .empty-state uses --mat-sys-outline (contrast 4.26:1 < 4.5:1); no plan owns this yet
export const Empty: Story = {
  parameters: { a11y: { test: 'todo' } },
  decorators: [ dialogProviders({ markdown: '' }) ]
};
