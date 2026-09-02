import { Meta, StoryObj } from '@storybook/angular';
import { PageHeaderComponent } from './page-header.component';

const meta: Meta<PageHeaderComponent> = {
  title: 'Components/PageHeader',
  component: PageHeaderComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<PageHeaderComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<ui-page-header></ui-page-header>`
    };
  }
};
