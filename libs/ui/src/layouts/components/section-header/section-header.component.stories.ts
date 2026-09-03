import { Meta, StoryObj } from '@storybook/angular';
import { SectionHeaderComponent } from './section-header.component';

const meta: Meta<SectionHeaderComponent> = {
  title: 'Components/SectionHeader',
  component: SectionHeaderComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<SectionHeaderComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<ui-section-header></ui-section-header>`
    };
  }
};
