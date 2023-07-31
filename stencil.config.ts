import { Config } from '@stencil/core';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export const config: Config = {
  namespace: 'browser-video-thumbnail-generator',
  enableCache: true,
  hashFileNames: true,
  sourceMap: false,
  minifyCss: true,
  autoprefixCss: true,
  rollupPlugins: {
    before: [
    ],
    after: [
      nodePolyfills()
    ]
  },
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
    browser:true
  }
};
