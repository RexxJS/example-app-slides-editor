/**
 * Slides Editor - Webpack Configuration
 * Supports both development and production builds for Tauri
 */

const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = (argv && argv.mode === 'production') || process.env.NODE_ENV === 'production';
  const isDev = !isProduction;

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isDev ? 'eval' : false,
    entry: isDev
      ? [
          './src/index',
          'webpack-dev-server/client?http://0.0.0.0:8080',
          'webpack/hot/only-dev-server'
        ]
      : './src/index',
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'bundle.js',
      publicPath: isDev ? '/static/' : './'
    },
    devServer: {
      port: 8080,
      hot: true,
      static: path.join(__dirname, 'dist')
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['es2015', 'react', 'stage-0']
            }
          }
        },
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader']
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico|svg)$/i,
          type: 'asset/resource'
        }
      ]
    },
    plugins: isDev
      ? [
          new webpack.HotModuleReplacementPlugin()
        ]
      : [],
    optimization: {
      minimize: isProduction
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json']
    }
  };
};
