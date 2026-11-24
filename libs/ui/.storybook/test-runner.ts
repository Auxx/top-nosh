import { getStoryContext, TestRunnerConfig } from '@storybook/test-runner';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

const defaultSize = { width: 1280, height: 720 };

// The manager applies `globals.viewport`; the test runner loads iframe.html
// directly, so the story's viewport is applied to the page here.
const config: TestRunnerConfig = {
  async preVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    const globals = (storyContext as { storyGlobals?: unknown; }).storyGlobals as {
      viewport?: { value?: string; } | string;
    } | undefined;
    const viewport = globals?.viewport ?? storyContext.parameters?.['viewport']?.defaultViewport;
    const key = typeof viewport === 'string' ? viewport : viewport?.value;
    const styles = key ? MINIMAL_VIEWPORTS[key as keyof typeof MINIMAL_VIEWPORTS]?.styles : undefined;

    await page.setViewportSize(
      styles
        ? { width: parseInt(styles.width, 10), height: parseInt(styles.height, 10) }
        : defaultSize
    );
  }
};

export default config;
