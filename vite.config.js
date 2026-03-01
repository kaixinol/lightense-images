const path = require('path');
const {defineConfig} = require('vite');
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
      cssFileName: 'lightense'
    },
    rollupOptions: {
      output: [
        {
          format: 'umd',
          name: 'Lightense',
          dir: path.resolve(__dirname, 'dist'),
          entryFileNames: 'lightense.js',
          banner,
          exports: 'default'
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
              compress: {
                passes: 3,
                toplevel: true,
                keep_fargs: false,
                pure_getters: true,
                drop_console: true,
                drop_debugger: true,
                unsafe: true,
                unsafe_arrows: true,
                unsafe_comps: true,
                unsafe_math: true,
                unsafe_methods: true,
                unsafe_undefined: true
              },
              mangle: {
                toplevel: true
              },
              format: {
                comments: false,
                semicolons: false
              }
            })
          ]
        }
      ]
    }
  }
});
