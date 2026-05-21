import { describe, it, expect, afterEach } from 'vitest';
import { VideoThumbnailGenerator } from './videoThumbnailGenerator';

// Vitest browser mode serves the project root over HTTP, so a plain path
// resolves to the fixture without needing a Vite `?url` import.
const sampleUrl = '/src/test-fixtures/sample.mp4';

// Browser test — runs in a real headless Chromium via Playwright, so the
// HTMLVideoElement actually decodes the fixture and the canvas captures pixels.
// The fixture is a 2s 320x240 H.264 testsrc clip generated via ffmpeg.

const generators: VideoThumbnailGenerator[] = [];

function track(gen: VideoThumbnailGenerator): VideoThumbnailGenerator {
  generators.push(gen);
  return gen;
}

afterEach(() => {
  while (generators.length > 0) {
    generators.pop()!.revokeUrls();
  }
});

// Load a blob URL into an <img> and resolve once the image is decoded.
// Catches the case where the canvas blob is empty/corrupt.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to decode thumbnail blob: ${src}`));
    img.src = src;
  });
}

describe('VideoThumbnailGenerator (browser)', () => {
  it('extracts a middle-frame thumbnail with the correct dimensions', async () => {
    const gen = track(new VideoThumbnailGenerator(sampleUrl));
    const result = await gen.getThumbnail('middle');

    expect(result.width).toBe(320);
    expect(result.height).toBe(240);
    expect(result.thumbnail).toMatch(/^blob:/);

    const img = await loadImage(result.thumbnail);
    expect(img.naturalWidth).toBe(320);
    expect(img.naturalHeight).toBe(240);
  });

  it('extracts N evenly spaced thumbnails', async () => {
    const gen = track(new VideoThumbnailGenerator(sampleUrl));
    const thumbs = await gen.getThumbnails(3);

    expect(thumbs).toHaveLength(3);
    for (const t of thumbs) {
      expect(t.width).toBe(320);
      expect(t.height).toBe(240);
      const img = await loadImage(t.thumbnail);
      expect(img.naturalWidth).toBe(320);
    }
    // Different frames -> different blob URLs.
    const urls = new Set(thumbs.map(t => t.thumbnail));
    expect(urls.size).toBe(3);
  });

  it('rejects when the source is not a playable video', async () => {
    const gen = track(new VideoThumbnailGenerator('data:video/mp4;base64,not-a-real-video'));
    await expect(gen.getThumbnail()).rejects.toThrow(/Error loading video/);
  });

  it('revokes blob URLs so they become unloadable', async () => {
    const gen = new VideoThumbnailGenerator(sampleUrl);
    const { thumbnail } = await gen.getThumbnail();

    // Sanity: it loads before revocation.
    await loadImage(thumbnail);

    gen.revokeUrls();

    await expect(loadImage(thumbnail)).rejects.toThrow();
  });
});
