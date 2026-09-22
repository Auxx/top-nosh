import { Meta, StoryObj } from '@storybook/angular';
import { BlockLoaderComponent } from './block-loader.component';

const meta: Meta<BlockLoaderComponent> = {
  title: 'Components/BlockLoader',
  component: BlockLoaderComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<BlockLoaderComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<ui-block-loader></ui-block-loader>`
    };
  }
};
