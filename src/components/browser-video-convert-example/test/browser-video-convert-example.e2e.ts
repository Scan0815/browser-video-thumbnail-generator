import { newE2EPage } from '@stencil/core/testing';

describe('browser-video-convert-example', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<browser-video-convert-example></browser-video-convert-example>');

    const element = await page.find('browser-video-convert-example');
    expect(element).toHaveClass('hydrated');
  });
});
