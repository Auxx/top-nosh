import { MatButtonModule } from '@angular/material/button';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { argsToTemplate, moduleMetadata } from '@storybook/angular-vite';
import { InfoCardComponent } from './info-card.component';

const meta: Meta<InfoCardComponent> = {
  title: 'Layouts/InfoCard',
  component: InfoCardComponent,
  tags: [ 'autodocs' ],
  decorators: [ moduleMetadata({ imports: [ MatButtonModule ] }) ]
};

export default meta;

type Story = StoryObj<InfoCardComponent>;

export const Static: Story = {
  args: { icon: 'layers_clear' },
  render: args => ({
    props: args,
    template: `<ui-info-card ${argsToTemplate(args)}><section>Nothing here yet.</section></ui-info-card>`
  })
};

export const DropZone: Story = {
  args: { icon: 'layers_clear', dragAndDrop: true },
  render: args => ({
    props: args,
    template: `
      <ui-info-card ${argsToTemplate(args)}>
        <section>Drop a file here or <button matButton>choose a file</button></section>
      </ui-info-card>`
  })
};

export const Dragging: Story = {
  ...DropZone,
  args: { ...DropZone.args, isDragging: true }
};
