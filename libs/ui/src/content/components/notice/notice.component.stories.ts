import type { Meta, StoryObj } from '@storybook/angular-vite';
import { NoticeComponent } from './notice.component';

const meta: Meta<NoticeComponent> = {
  title: 'Content/Notice',
  component: NoticeComponent,
  tags: [ 'autodocs' ]
};

export default meta;

type Story = StoryObj<NoticeComponent>;

export const Default: Story = {
  render: () => ({ template: '<ui-notice>No recipes match your search.</ui-notice>' })
};
