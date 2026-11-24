import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MenuBarComponent, MenuItem } from './menu-bar.component';

const items: MenuItem[] = [
  { url: '/dashboard', label: 'Dashboard' },
  { url: '/recipes', label: 'Recipes' },
  { url: '/shopping-lists', label: 'Shopping Lists' },
  { url: '/settings', label: 'Settings' },
  { url: '/logout', label: 'Log out', icon: 'logout' }
];

const meta: Meta<MenuBarComponent> = {
  title: 'Navigation/MenuBar',
  component: MenuBarComponent,
  tags: [ 'autodocs' ],
  args: { title: 'Top Nosh', items },
  render: args => ({
    props: args,
    template: `<ui-menu-bar [title]="title" [items]="items"></ui-menu-bar>`
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
