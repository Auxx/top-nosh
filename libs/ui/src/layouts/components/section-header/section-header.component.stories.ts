import type { Meta, StoryObj } from '@storybook/angular-vite';
import { argsToTemplate } from '@storybook/angular-vite';
import { SectionHeaderComponent } from './section-header.component';

const meta: Meta<SectionHeaderComponent> = {
  title: 'Layouts/SectionHeader',
  component: SectionHeaderComponent,
  tags: [ 'autodocs' ],
  render: args => ({
    props: args,
    template: `<ui-section-header ${argsToTemplate(args)}></ui-section-header>`
  })
};

export default meta;

type Story = StoryObj<SectionHeaderComponent>;

export const Default: Story = {
  args: {
    title: 'Ingredients',
    icon: 'restaurant',
    description: 'Everything you need for this recipe.'
  }
};

export const TitleOnly: Story = {
  args: { title: 'Ingredients' }
};
