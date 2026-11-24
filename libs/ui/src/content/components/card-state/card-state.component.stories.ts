import type { Meta, StoryObj } from '@storybook/angular-vite';
import { argsToTemplate } from '@storybook/angular-vite';
import { CardStateComponent } from './card-state.component';

const meta: Meta<CardStateComponent> = {
  title: 'Content/CardState',
  component: CardStateComponent,
  tags: [ 'autodocs' ]
};

export default meta;

type Story = StoryObj<CardStateComponent>;

export const Loading: Story = {
  args: { isLoading: true },
  render: args => ({
    props: args,
    template: `<ui-card-state ${argsToTemplate(args)}></ui-card-state>`
  })
};

export const Error: Story = {
  args: { errorMessage: 'Could not load the recipes.' },
  render: args => ({
    props: args,
    template: `<ui-card-state ${argsToTemplate(args)}></ui-card-state>`
  })
};

export const Notice: Story = {
  args: { noticeMessage: 'No recipes match your search.' },
  render: args => ({
    props: args,
    template: `<ui-card-state ${argsToTemplate(args)}></ui-card-state>`
  })
};

export const Content: Story = {
  render: args => ({
    props: args,
    template: `<ui-card-state ${argsToTemplate(args)}><p>Recipe content goes here.</p></ui-card-state>`
  })
};
