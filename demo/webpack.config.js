const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    app: [
      path.resolve(__dirname, 'src', 'index.js'),
      'webpack/hot/dev-server'
    ]
  },
  output: {
    filename: `[name].js`,
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html'),
      hash: false,
      filename: 'index.html',
      inject: 'body',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel'
      }
    ]
  },
  resolve: {
    alias: {
      'react-reformed$': path.resolve(__dirname, '..', 'src', 'reformed'),
      'react-reformed/lib/compose$': path.resolve(__dirname, '..', 'src', 'compose'),
      'react-reformed/lib/syncWith$': path.resolve(__dirname, '..', 'src', 'syncWith'),
      'react-reformed/lib/validate$': path.resolve(__dirname, '..', 'src', 'validate'),
    }
  }
}
