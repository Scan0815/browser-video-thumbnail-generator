import { newSpecPage } from '@stencil/core/testing';
import { BrowserVideoConvertExample } from '../browser-video-convert-example';

describe('browser-video-convert-example', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [BrowserVideoConvertExample],
      html: `<browser-video-convert-example></browser-video-convert-example>`,
    });
    expect(page.root).toEqualHtml(`
      <browser-video-convert-example>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </browser-video-convert-example>
    `);
  });
});
