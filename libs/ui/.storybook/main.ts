import type { StorybookConfig } from '@storybook/angular-vite';

const config: StorybookConfig = {
  stories: [ '../src/**/*.stories.ts' ],
  addons: [ '@storybook/addon-a11y' ],
  framework: { name: '@storybook/angular-vite', options: {} },
  staticDirs: [ { from: '../../../apps/web/public/assets', to: '/assets' } ]
};

export default config;
