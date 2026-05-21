import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { VideoThumbnailGenerator } from './videoThumbnailGenerator';

type Listener = (event: Event) => void;

interface FakeVideoElement {
  src: string;
  muted: boolean;
  playsInline: boolean;
  preload: string;
  crossOrigin: string | null;
  videoWidth: number;
  videoHeight: number;
  duration: number;
  currentTime: number;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  fire(type: string): void;
  listenerCount(type: string): number;
}

interface FakeCanvasElement {
  width: number;
  height: number;
  getContext: ReturnType<typeof vi.fn>;
  toBlob: ReturnType<typeof vi.fn>;
  drawImageMock: ReturnType<typeof vi.fn>;
}

function createFakeVideo(): FakeVideoElement {
  const listeners = new Map<string, Set<Listener>>();
  const video: FakeVideoElement = {
    src: '',
    muted: false,
    playsInline: false,
    preload: '',
    crossOrigin: null,
    videoWidth: 0,
    videoHeight: 0,
    duration: 0,
    currentTime: 0,
    addEventListener: vi.fn((type: string, fn: Listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    }),
    removeEventListener: vi.fn((type: string, fn: Listener) => {
      listeners.get(type)?.delete(fn);
    }),
    load: vi.fn(),
    fire(type: string) {
      const set = listeners.get(type);
      if (!set) return;
      for (const fn of Array.from(set)) {
        fn(new Event(type));
      }
    },
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
  };
  return video;
}

function createFakeCanvas(): FakeCanvasElement {
  const drawImageMock = vi.fn();
  const context = { drawImage: drawImageMock };
  return {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(context),
    toBlob: vi.fn((cb: BlobCallback) => cb(new Blob(['fake']))),
    drawImageMock,
  };
}

describe('VideoThumbnailGenerator', () => {
  let video: FakeVideoElement;
  let canvas: FakeCanvasElement;
  let createObjectURLSpy: MockInstance<typeof URL.createObjectURL>;
  let revokeObjectURLSpy: MockInstance<typeof URL.revokeObjectURL>;
  let urlCounter: number;

  beforeEach(() => {
    vi.useFakeTimers();
    urlCounter = 0;
    video = createFakeVideo();
    canvas = createFakeCanvas();

    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'video') return video as unknown as HTMLVideoElement;
      if (tag === 'canvas') return canvas as unknown as HTMLCanvasElement;
      throw new Error(`unexpected createElement(${tag})`);
    }) as typeof document.createElement);

    createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => `blob:fake-${++urlCounter}`);
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Drive the generator through one (or more) thumbnail extractions.
  // `setup` mutates the video mock (duration, dimensions) before metadata fires.
  async function runThumbnail(
    promise: Promise<unknown>,
    setup: (v: FakeVideoElement) => void,
    frameCount = 1,
  ): Promise<unknown> {
    await Promise.resolve();
    setup(video);
    video.fire('loadedmetadata');

    for (let i = 0; i < frameCount; i++) {
      // Let the generator attach the 'seeked' listener and set currentTime.
      await Promise.resolve();
      await Promise.resolve();
      video.fire('seeked');
      await vi.advanceTimersByTimeAsync(100);
    }

    return promise;
  }

  describe('constructor', () => {
    it('throws when no video source is provided', () => {
      expect(() => new VideoThumbnailGenerator('')).toThrow('No video source provided');
    });

    it('configures the underlying <video> element with crossOrigin=anonymous', () => {
      new VideoThumbnailGenerator('/some.mp4');
      expect(video.crossOrigin).toBe('anonymous');
    });
  });

  describe('getThumbnail()', () => {
    it('defaults to the middle of the video', async () => {
      const gen = new VideoThumbnailGenerator('/v.mp4');
      const result = await runThumbnail(gen.getThumbnail(), v => {
        v.videoWidth = 320;
        v.videoHeight = 240;
        v.duration = 10;
      });

      expect(video.currentTime).toBe(5);
      expect(canvas.width).toBe(320);
      expect(canvas.height).toBe(240);
      expect(result).toEqual({ width: 320, height: 240, thumbnail: 'blob:fake-1' });
    });

    it('clamps "start" to a small offset to avoid black frames', async () => {
      const gen = new VideoThumbnailGenerator('/v.mp4');
      await runThumbnail(gen.getThumbnail('start'), v => {
        v.videoWidth = 100;
        v.videoHeight = 100;
        v.duration = 10;
      });
      expect(video.currentTime).toBe(0.1);
    });

    it('uses the very last instant for "end"', async () => {
      const gen = new VideoThumbnailGenerator('/v.mp4');
      await runThumbnail(gen.getThumbnail('end'), v => {
        v.videoWidth = 100;
        v.videoHeight = 100;
        v.duration = 12;
      });
      expect(video.currentTime).toBe(12);
    });

    it('treats a numeric framePosition as a percentage of duration', async () => {
      const gen = new VideoThumbnailGenerator('/v.mp4');
      await runThumbnail(gen.getThumbnail(25), v => {
        v.videoWidth = 100;
        v.videoHeight = 100;
        v.duration = 40;
      });
      expect(video.currentTime).toBe(10);
    });

    it('rejects with a descriptive error when the video fails to load', async () => {
      const gen = new VideoThumbnailGenerator('/broken.mp4');
      const promise = gen.getThumbnail();
      await Promise.resolve();
      video.fire('error');
      await expect(promise).rejects.toThrow(/Error loading video/);
    });

    it('detaches metadata listeners after success', async () => {
      const gen = new VideoThumbnailGenerator('/v.mp4');
      await runThumbnail(gen.getThumbnail(), v => {
        v.videoWidth = 1;
        v.videoHeight = 1;
        v.duration = 2;
      });
      expect(video.listenerCount('loadedmetadata')).toBe(0);
      expect(video.listenerCount('error')).toBe(0);
      expect(video.listenerCount('seeked')).toBe(0);
    });
  });

  describe('getThumbnails()', () => {
    it('extracts the requested number of evenly spaced frames', async () => {
      const gen = new VideoThumbnailGenerator('/v.mp4');
      const numFrames = 4;
      const result = (await runThumbnail(
        gen.getThumbnails(numFrames),
        v => {
          v.videoWidth = 160;
          v.videoHeight = 90;
          v.duration = 8;
        },
        numFrames,
      )) as Array<{ thumbnail: string }>;

      expect(result).toHaveLength(numFrames);
      expect(createObjectURLSpy).toHaveBeenCalledTimes(numFrames);
      expect(canvas.drawImageMock).toHaveBeenCalledTimes(numFrames);
      // Last frame should be seeked to (numFrames - 1) * duration / numFrames = 6
      expect(video.currentTime).toBe(6);
    });
  });

  describe('revokeUrls()', () => {
    it('revokes every blob URL produced by previous extractions', async () => {
      const gen = new VideoThumbnailGenerator('/v.mp4');
      await runThumbnail(
        gen.getThumbnails(2),
        v => {
          v.videoWidth = 10;
          v.videoHeight = 10;
          v.duration = 2;
        },
        2,
      );

      expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
      gen.revokeUrls();
      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(2);

      gen.revokeUrls();
      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(2);
    });
  });
});
