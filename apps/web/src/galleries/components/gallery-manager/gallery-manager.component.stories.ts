import { Meta, StoryObj } from '@storybook/angular';
import { GalleryManagerComponent } from './gallery-manager.component';

const meta: Meta<GalleryManagerComponent> = {
  title: 'Components/GalleryManager',
  component: GalleryManagerComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<GalleryManagerComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-gallery-manager></app-gallery-manager>`
    };
  }
};
