import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'browser-video-thumbnail-generator',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
  nodeResolve: {
    browser: false
  },
  testing: {
    browserHeadless: "new",
  },
};
