const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    app: [
      path.resolve(__dirname, 'src', 'index.js')
    ]
  },
  output: {
    filename: `[name].js`,
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html'),
      hash: false,
      filename: 'index.html',
      inject: 'body',
    }),
  ].concat(process.env.NODE_ENV === 'production'
    ? [
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          unused: true,
          dead_code: true,
          warnings: false
        }
      })
    ]
    : [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin()
    ]),
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
