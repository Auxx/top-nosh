import { Meta, StoryObj } from '@storybook/angular';
import { MenuBarComponent } from './menu-bar.component';

const meta: Meta<MenuBarComponent> = {
  title: 'Components/MenuBar',
  component: MenuBarComponent,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<MenuBarComponent>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<lib-menu-bar></lib-menu-bar>`
    };
  }
};
