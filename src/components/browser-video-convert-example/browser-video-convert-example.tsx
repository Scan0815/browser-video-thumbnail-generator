import { Component, h, ComponentInterface, Prop, State } from '@stencil/core';
import VideoThumbnailGenerator from '../../libs/videoThumbnailGenerator';
@Component({
  tag: 'browser-video-convert-example',
  styleUrl: 'browser-video-convert-example.css'
})
export class BrowserVideoConvertExample implements ComponentInterface {
  @Prop() videoSrc:string;
  @Prop() framePosition: 'start' | 'middle' | 'end' | number = 'middle';
  @State() objectURL:string;
  @State() generatedImg:{ width: number, height: number, thumbnail: string } = null;

  private convert: VideoThumbnailGenerator;
  async componentWillLoad(){
    // Converting videourl to local
    const blob = await fetch(this.videoSrc)
      .then(response => response.blob());
    // Create a local URL for the video blob
    this.objectURL = URL.createObjectURL(blob);

    //create Thumbnail on position
    this.convert = new VideoThumbnailGenerator(this.objectURL);
    this.generatedImg = await this.convert.getThumbnail(this.framePosition);


    //cleanup
    URL.revokeObjectURL(this.objectURL);
    setTimeout(() => {
      this.convert.revokeUrls();
    },1000);
  }

  disconnectedCallback() {
    URL.revokeObjectURL(this.objectURL);
    this.convert.revokeUrls();
  }

  render() {
    return (
      <div>
        {this.generatedImg &&
          <img alt="test" src={this.generatedImg.thumbnail}/>
        }
      </div>
    );
  }

}
