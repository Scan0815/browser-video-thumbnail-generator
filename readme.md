# Video Thumbnail Generator

This is a library for generating thumbnails from video files. It provides a simple API for extracting a single frame or multiple frames from a video and returning them as images.

## Installation

You can install this package using npm:

`npm install browser-video-thumbnail-generator`

## Usage

Here's how you can use this library to generate a thumbnail from a video:

```
import {VideoThumbnailGenerator} from "browser-video-thumbnail-generator";

const videoSrc = 'path-to-your-video-file';
const generator = new VideoThumbnailGenerator(videoSrc);

generator.getThumbnail()
  .then((thumbnail) => {
    // Use the thumbnail...
    console.log(thumbnail);
    // When you're done with the thumbnail, revoke it to free memory
    generator.revokeUrls();
  });
```

You can also generate multiple thumbnails at once:

```
  generator.getThumbnails(5)
  .then((thumbnails) => {
    // Use the thumbnails...
    console.log(thumbnails);
    // When you're done with the thumbnails, revoke them to free memory`
    generator.revokeUrls();`
  });
```

If the Video is not playable the promise will rejected with an error message.

## License

MIT License

Copyright (c) 2018

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.