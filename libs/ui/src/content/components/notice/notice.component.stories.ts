import { Meta, StoryObj } from '@storybook/angular';
import { NoticeComponent } from './notice.component';

const meta: Meta<NoticeComponent> = {
  title: 'Components/Notice',
  component: NoticeComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<NoticeComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<ui-notice></ui-notice>`
    };
  }
};
