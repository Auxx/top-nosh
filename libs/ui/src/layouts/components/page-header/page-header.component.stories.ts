import { MatButtonModule } from '@angular/material/button';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { argsToTemplate, moduleMetadata } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { PageHeaderComponent } from './page-header.component';

const meta: Meta<PageHeaderComponent> = {
  title: 'Layouts/PageHeader',
  component: PageHeaderComponent,
  tags: [ 'autodocs' ],
  decorators: [ moduleMetadata({ imports: [ MatButtonModule ] }) ],
  args: { navigatedBack: fn() },
  render: args => ({
    props: args,
    template: `
      <ui-page-header ${argsToTemplate(args)}>
        <h1>Recipes</h1>
        <div>All your saved recipes</div>
        <button matButton>Import</button>
        <button matButton>New recipe</button>
      </ui-page-header>`
  })
};

export default meta;

type Story = StoryObj<PageHeaderComponent>;

export const Default: Story = {};

export const WithBack: Story = {
  args: { showBackButton: true }
};

export const Compact: Story = {
  args: { compact: true }
};

export const SingleLine: Story = {
  args: { singleLine: true }
};

export const Mobile: Story = {
  ...WithBack,
  globals: { viewport: { value: 'mobile1', isRotated: false } }
};
