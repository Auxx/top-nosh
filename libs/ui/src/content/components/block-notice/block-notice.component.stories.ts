import { Meta, StoryObj } from '@storybook/angular';
import { BlockNoticeComponent } from './block-notice.component';

const meta: Meta<BlockNoticeComponent> = {
  title: 'Components/BlockNotice',
  component: BlockNoticeComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<BlockNoticeComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<ui-block-notice></ui-block-notice>`
    };
  }
};
