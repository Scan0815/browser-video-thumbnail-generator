import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'browser-video-thumbnail-generator',
  enableCache: true,
  hashFileNames: true,
  sourceMap: true,
  minifyCss: true,
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      dir: 'custom-element',
      empty: true,
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
  testing: {
    browserHeadless: "new",
  },
  nodeResolve: {
    browser:false
  }
};
