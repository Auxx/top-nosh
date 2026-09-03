import { Meta, StoryObj } from '@storybook/angular';
import { GlanceStagesComponent } from './glance-stages.component';

const meta: Meta<GlanceStagesComponent> = {
  title: 'Components/GlanceStages',
  component: GlanceStagesComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<GlanceStagesComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-glance-stages></app-glance-stages>`
    };
  }
};
