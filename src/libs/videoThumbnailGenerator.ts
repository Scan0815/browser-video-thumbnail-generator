export class VideoThumbnailGenerator {
  private readonly video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private blobUrls: string[] = [];
  private readonly videoSrc: string;
  constructor(videoSrc: string) {
    this.video = document.createElement('video');
    this.canvas = document.createElement('canvas');
    this.video.crossOrigin = 'anonymous';
    this.videoSrc = videoSrc;
    if (!this.videoSrc) {
      throw new Error('No video source provided');
    }
  }

  private drawThumbnailAtTime(time: number): Promise<{ width: number, height: number, thumbnail: string }> {
    return new Promise((resolve, reject) => {
      this.video.currentTime = time;
      const onSeeked = () => {
        setTimeout(() => {
          const context = this.canvas.getContext('2d');
          context?.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);

          this.canvas.toBlob((blob) => {
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              this.blobUrls.push(blobUrl);
              resolve({
                width: this.video.videoWidth,
                height: this.video.videoHeight,
                thumbnail: blobUrl,
              });
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          });

          this.video.removeEventListener('seeked', onSeeked);
        },100);
      };
      this.video.addEventListener('seeked', onSeeked);
    });
  }

  private initVideo() {
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.preload = 'metadata';
    this.video.src = this.videoSrc;
    this.video.load();
  }

  private addListener(resolve: (value: any) => void, reject: (reason?: any) => void) {
    const onLoadMetaData = () => {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      resolve(null);
      this.video.removeEventListener('loadedmetadata', onLoadMetaData);
      this.video.removeEventListener('error', onError);
    };

    const onError = () => {
      reject(new Error('Error loading video (codec might not be supported by this browser)'));
      this.video.removeEventListener('loadedmetadata', onLoadMetaData);
      this.video.removeEventListener('error', onError);
    };

    this.video.addEventListener('loadedmetadata', onLoadMetaData);
    this.video.addEventListener('error', onError);
  }

  public async generateThumbnails(numFrames: number): Promise<{ width: number, height: number, thumbnail: string }[]> {
    this.initVideo();
    await new Promise((resolve, reject) => this.addListener(resolve, reject));
    const thumbnails = [];
    const duration = this.video.duration;
    const interval = duration / numFrames;
    for (let i = 0; i < numFrames; i++) {
      const time = i * interval;
      thumbnails.push(await this.drawThumbnailAtTime(time));
    }

    return thumbnails;
  }

  public async getThumbnail(framePosition: 'start' | 'middle' | 'end' | number = 'middle'): Promise<{
    width: number,
    height: number,
    thumbnail: string
  }> {
    this.initVideo();
    await new Promise((resolve, reject) => this.addListener(resolve, reject));
    let time = 0;
    if (typeof framePosition === 'number') {
      time = this.video.duration * framePosition / 100;
    } else {
      switch (framePosition) {
        case 'start':
          time = Math.min(0.1, this.video.duration);
          break;
        case 'middle':
          time = this.video.duration / 2;
          break;
        case 'end':
          time = this.video.duration;
          break;
      }
    }
    return this.drawThumbnailAtTime(time);
  }

  public revokeUrls(): void {
    for (const url of this.blobUrls) {
      URL.revokeObjectURL(url);
    }
    this.blobUrls = [];
  }
}
