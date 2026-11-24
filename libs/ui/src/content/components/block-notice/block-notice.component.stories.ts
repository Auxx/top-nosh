import type { Meta, StoryObj } from '@storybook/angular-vite';
import { argsToTemplate } from '@storybook/angular-vite';
import { BlockNoticeComponent } from './block-notice.component';

const meta: Meta<BlockNoticeComponent> = {
  title: 'Content/BlockNotice',
  component: BlockNoticeComponent,
  tags: [ 'autodocs' ]
};

export default meta;

type Story = StoryObj<BlockNoticeComponent>;

export const Info: Story = {
  args: { icon: 'info' },
  render: args => ({
    props: args,
    template: `<ui-block-notice ${argsToTemplate(args)}>Your order will arrive soon.</ui-block-notice>`
  })
};

export const Error: Story = {
  args: { icon: 'error', isError: true },
  render: args => ({
    props: args,
    template: `<ui-block-notice ${argsToTemplate(args)}>Something went wrong.</ui-block-notice>`
  })
};
