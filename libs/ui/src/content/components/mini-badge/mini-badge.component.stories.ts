import type { Meta, StoryObj } from '@storybook/angular-vite';
import { argsToTemplate } from '@storybook/angular-vite';
import { MiniBadgeComponent } from './mini-badge.component';

const meta: Meta<MiniBadgeComponent> = {
  title: 'Content/MiniBadge',
  component: MiniBadgeComponent,
  tags: [ 'autodocs' ],
  render: args => ({
    props: args,
    template: `<ui-mini-badge ${argsToTemplate(args)}>Badge</ui-mini-badge>`
  })
};

export default meta;

type Story = StoryObj<MiniBadgeComponent>;

export const Primary: Story = { args: { color: 'primary' } };

export const Secondary: Story = { args: { color: 'secondary' } };

export const Tertiary: Story = { args: { color: 'tertiary' } };

export const Error: Story = { args: { color: 'error' } };

export const Alternative: Story = { args: { color: 'primary', alternative: true } };
