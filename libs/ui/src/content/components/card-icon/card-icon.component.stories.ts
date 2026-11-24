import type { Meta, StoryObj } from '@storybook/angular-vite';
import { argsToTemplate } from '@storybook/angular-vite';
import { CardIconComponent } from './card-icon.component';

const meta: Meta<CardIconComponent> = {
  title: 'Content/CardIcon',
  component: CardIconComponent,
  tags: [ 'autodocs' ]
};

export default meta;

type Story = StoryObj<CardIconComponent>;

export const Default: Story = {
  args: { icon: 'restaurant' },
  render: args => ({
    props: args,
    template: `<ui-card-icon ${argsToTemplate(args)}></ui-card-icon>`
  })
};
