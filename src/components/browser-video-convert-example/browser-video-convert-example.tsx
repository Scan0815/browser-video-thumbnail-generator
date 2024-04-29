import { Component, h, ComponentInterface, Prop, State } from '@stencil/core';
import { VideoThumbnailGenerator } from '../../libs/videoThumbnailGenerator';

@Component({
  tag: 'browser-video-convert-example',
  styleUrl: 'browser-video-convert-example.css',
})
export class BrowserVideoConvertExample implements ComponentInterface {
  @Prop() videoSrc: string | undefined;
  @Prop() framePosition: 'start' | 'middle' | 'end' | number = 'middle';
  @State() objectURL: string | undefined;
  @State() generatedImg: { width: number, height: number, thumbnail: string } | null = null;
  @State() generatedImgs: { width: number, height: number, thumbnail: string }[] | null = null;
  private convert: VideoThumbnailGenerator | undefined;

  async componentWillLoad() {
    // Converting videourl to local
    const blob = await fetch(this.videoSrc as string)
      .then(response => response.blob());
    // Create a local URL for the video blob
    this.objectURL = URL.createObjectURL(blob);

    //create Thumbnail on position
    this.convert = new VideoThumbnailGenerator(this.objectURL) as VideoThumbnailGenerator;
    this.generatedImg = await this.convert.getThumbnail(this.framePosition);
    this.generatedImgs = await this.convert.getThumbnails(5);

    //cleanup
    URL.revokeObjectURL(this.objectURL as string);
    setTimeout(() => {
      this.convert?.revokeUrls();
    }, 1000);
  }

  disconnectedCallback() {
    URL.revokeObjectURL(this.objectURL as string);
    this.convert?.revokeUrls();
  }

  render() {
    return (
      <div>
        <ul>
          <li>getThumbnail {this.framePosition}</li>
          {this.generatedImg &&
            <li><img width={200} alt='test' src={this.generatedImg.thumbnail} /></li>
          }
        </ul>
        <ul>
          <li>getThumbnails</li>
          {this.generatedImgs && this.generatedImgs.map((img) =>
            <li><img width={200} alt='test test' src={img.thumbnail} /></li>,
          )}
        </ul>
      </div>
    );
  }

}
