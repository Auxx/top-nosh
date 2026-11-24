import { getStoryContext, TestRunnerConfig } from '@storybook/test-runner';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

const defaultSize = { width: 1280, height: 720 };

// The manager applies `globals.viewport`; the test runner loads iframe.html
// directly, so the story's viewport is applied to the page here.
const config: TestRunnerConfig = {
  async preVisit(page, context) {
    // The icon font comes from a stylesheet link in preview-head.html. Until it
    // has loaded, axe reads ligature text such as "logout" as visible text and
    // reports label-content-name-mismatch, so a11y runs must wait for it.
    await page.evaluate(async () => {
      await document.fonts.load('24px "Material Icons"');
      await document.fonts.ready;
      if (!document.fonts.check('24px "Material Icons"')) {
        throw new Error('Material Icons font failed to load');
      }
    });

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
