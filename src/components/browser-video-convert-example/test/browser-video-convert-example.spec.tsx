import { describe, it, expect } from 'vitest';
import { render, h } from '@stencil/vitest';

describe('browser-video-convert-example', () => {
  it('renders the placeholder when no videoSrc is provided', async () => {
    const { root } = await render(<browser-video-convert-example />);

    expect(root).toHaveClass('hydrated');
    const lists = root.querySelectorAll('ul');
    expect(lists).toHaveLength(2);
    // No thumbnails rendered because videoSrc is missing.
    expect(root.querySelectorAll('img')).toHaveLength(0);
    expect(root.textContent).toContain('getThumbnail middle');
    expect(root.textContent).toContain('getThumbnails');
  });

  it('reflects the framePosition prop', async () => {
    const { root } = await render(<browser-video-convert-example frame-position="start" />);
    expect(root.textContent).toContain('getThumbnail start');
  });
});
