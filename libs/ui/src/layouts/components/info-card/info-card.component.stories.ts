import { Meta, StoryObj } from '@storybook/angular';
import { InfoCardComponent } from './info-card.component';

const meta: Meta<InfoCardComponent> = {
  title: 'Components/InfoCard',
  component: InfoCardComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<InfoCardComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<ui-info-card></ui-info-card>`
    };
  }
};
