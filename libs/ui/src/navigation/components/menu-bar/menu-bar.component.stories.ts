import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MenuBarComponent } from './menu-bar.component';

const meta: Meta<MenuBarComponent> = {
  title: 'Navigation/MenuBar',
  component: MenuBarComponent,
  tags: [ 'autodocs' ],
  render: args => ({
    props: args,
    template: `<ui-menu-bar></ui-menu-bar>`
  })
};

export default meta;

type Story = StoryObj<MenuBarComponent>;

// TODO(plan 07): M3
export const Desktop: Story = {
  parameters: { a11y: { test: 'todo' } }
};

// TODO(plan 07): M3
export const Mobile: Story = {
  parameters: { a11y: { test: 'todo' } },
  globals: { viewport: { value: 'mobile1', isRotated: false } }
};
