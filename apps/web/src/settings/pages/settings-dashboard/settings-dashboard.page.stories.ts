import { Meta, StoryObj } from '@storybook/angular';
import { SettingsDashboardPage } from './settings-dashboard.page';

const meta: Meta<SettingsDashboardPage> = {
  title: 'Components/SettingsDashboard',
  component: SettingsDashboardPage,

  args: {},

  argTypes: {}
};

export default meta;

type Story = StoryObj<SettingsDashboardPage>;

export const Primary: Story = {
  render: props => {
    return {
      props,
      template: `<app-settings-dashboard></app-settings-dashboard>`
    };
  }
};
