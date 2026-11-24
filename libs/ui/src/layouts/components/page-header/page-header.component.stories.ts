import { MatButtonModule } from '@angular/material/button';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { argsToTemplate, moduleMetadata } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
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
        <div uiPageHeaderSubtitle>All your saved recipes</div>
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

export const LongTitle: Story = {
  render: args => ({
    props: args,
    template: `
      <div style="width: 800px">
        <ui-page-header ${argsToTemplate(args)}>
          <h1>A very long recipe title that keeps going and going until it has to wrap onto a second line</h1>
          <div uiPageHeaderSubtitle>All your saved recipes</div>
          <button matButton>Import</button>
          <button matButton>New recipe</button>
        </ui-page-header>
      </div>`
  }),
  play: ({ canvasElement }) => {
    const title = canvasElement.querySelector('h1')?.getBoundingClientRect();
    const subtitle = canvasElement.querySelector('[uiPageHeaderSubtitle]')?.getBoundingClientRect();
    expect(title).toBeDefined();
    expect(subtitle).toBeDefined();
    expect(title?.height).toBeGreaterThan(20);
    expect(title?.bottom).toBeLessThanOrEqual(subtitle?.top ?? 0);
  }
};

export const Mobile: Story = {
  args: { showBackButton: true },
  render: args => ({
    props: args,
    template: `
      <ui-page-header ${argsToTemplate(args)}>
        <h1>Recipes</h1>
        <div uiPageHeaderSubtitle>All your saved recipes</div>
        <button matButton>Import</button>
        <button matButton>New recipe</button>
        <button matButton>Export</button>
      </ui-page-header>`
  }),
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: ({ canvasElement }) => {
    expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth);
  }
};

export const MobileLongTitle: Story = {
  render: args => ({
    props: args,
    template: `
      <ui-page-header ${argsToTemplate(args)}>
        <h1>Supercalifragilisticexpialidocious_unbroken_word_sixty_chars</h1>
        <div uiPageHeaderSubtitle>All your saved recipes</div>
        <button matButton>Import</button>
        <button matButton>New recipe</button>
      </ui-page-header>`
  }),
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: ({ canvasElement }) => {
    expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth);
  }
};
