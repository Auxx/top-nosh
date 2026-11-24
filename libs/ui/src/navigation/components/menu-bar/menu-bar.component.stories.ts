import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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

export const Desktop: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } }
};

export const MobileKeyboard: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'More' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = within(document.body);
    await expect(await menu.findAllByRole('menuitem')).toHaveLength(5);
    await waitFor(() => expect(document.activeElement).toHaveAttribute('role', 'menuitem'));
    // CDK menus read the legacy keyCode, which user-event omits for Escape.
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true })
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  }
};
