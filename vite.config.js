const path = require('path');
const { defineConfig } = require('vite');
const terser = require('@rollup/plugin-terser');
const pkg = require('./package.json');

const banner = `/*! ${pkg.name} v${pkg.version} | © ${pkg.author} | ${pkg.license} */`;

module.exports = defineConfig({
  build: {
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'Lightense',
    },
    rollupOptions: {
      output: [
        {
          format: 'umd',
          name: 'Lightense',
          dir: path.resolve(__dirname, 'dist'),
          entryFileNames: 'lightense.js',
          banner,
          exports: 'default',
        },
        {
          format: 'umd',
          name: 'Lightense',
          dir: path.resolve(__dirname, 'dist'),
          entryFileNames: 'lightense.min.js',
          banner,
          exports: 'default',
          plugins: [
            terser({
              format: {
                comments: false,
              },
            }),
          ],
        },
      ],
    },
  },
});
