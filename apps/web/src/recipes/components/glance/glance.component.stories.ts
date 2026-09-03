import { Meta, StoryObj } from '@storybook/angular';
import { GlanceComponent } from './glance.component';

const meta: Meta<GlanceComponent> = {
  title: 'Components/Glance',
  component: GlanceComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<GlanceComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-glance></app-glance>`
    };
  }
};
