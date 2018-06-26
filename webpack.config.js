const path = require('path');

const SRC_DIR = path.join(__dirname, '/react-client/src');
const DIST_DIR = path.join(__dirname, '/react-client/dist');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const extractPlugin = new ExtractTextPlugin({
  filename: 'bundle.css',
});

module.exports = {
  entry: `${SRC_DIR}/index.jsx`,
  output: {
    filename: 'bundle.js',
    path: DIST_DIR,
  },
  module: {
    loaders: [{
      test: /\.jsx?/,
      include: SRC_DIR,
      loader: 'babel-loader',
      query: {
        presets: ['react', 'es2015', 'stage-2'],
      },
    },
    {
      test: /\.(s*)css$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
    },
    {
      test: /\.(gif|png|jpe?g|svg)$/i,
      use: [
        'file-loader',
        {
          loader: 'image-webpack-loader',
          options: {
            bypassOnDebug: true, // webpack@1.x
            disable: true, // webpack@2.x and newer
          },
        },
      ],
    },
    ],
  },
};
