import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import StartServerPlugin from 'start-server-webpack-plugin';

const root = process.cwd();
const isWin = process.platform === "win32";

// noinspection JSUnusedGlobalSymbols
export default {
  mode: 'development',
  target: 'async-node',
  context: root,
  watch: true,
  devtool: 'source-map',
  externals: [nodeExternals({
    whitelist: ['webpack/hot/poll?1000', 'webpack/hot/signal'],
  })],
  entry: {
    server: [
      isWin ? 'webpack/hot/poll?1000' : 'webpack/hot/signal',
      './server.js',
    ],
    hash: [
      './server/helpers/hash.worker.js',
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [root, 'node_modules'],
    alias: {
      "react-dom": '@hot-loader/react-dom',
    },
  },
  output: {
    path: path.join(root, 'build'),
    filename: '[name].js',
    chunkFilename: '[id].[name].js',
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new StartServerPlugin({
      name: 'server.js',
      signal: !isWin,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$|\.jsx$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        options: {
          presets: [
            ["@babel/preset-env", {
              targets: {
                node: "current",
              },
            }],
            ["@babel/preset-react", {
              development: true,
            }],
          ],
          plugins: [
            "@babel/plugin-proposal-object-rest-spread",
            "@babel/plugin-proposal-class-properties",
          ],
        },
      }, {
        test: /\.handlebars$/,
        loader: 'handlebars-loader',
      },
    ],
  },
};
