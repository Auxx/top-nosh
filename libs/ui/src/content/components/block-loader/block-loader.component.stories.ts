import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { BlockLoaderComponent } from './block-loader.component';

const meta: Meta<BlockLoaderComponent> = {
  title: 'Content/BlockLoader',
  component: BlockLoaderComponent,
  tags: [ 'autodocs' ]
};

export default meta;

type Story = StoryObj<BlockLoaderComponent>;

export const Default: Story = {
  render: () => ({ template: '<ui-block-loader></ui-block-loader>' }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText('Loading...')).toBeVisible();
  }
};
