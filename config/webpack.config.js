const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development", // production
  entry: {
    main: path.resolve(__dirname, "../src/index.js"),
  },
  output: {
    path: path.resolve(__dirname, "../dist/dev"),
    filename: "[name].bundle.js", // "[name].[contenthash].js"
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          // Disables attributes processing
          sources: false,
        },
      },
      {
        test: /\.(jpg|jpeg|png|gif|svg)$/,
        // use: ["file-loader"],
        use: "file-loader?name=[name].[ext]&outputPath=./img/",
      },
    ],
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "../static"),
          to: path.resolve(__dirname, "../dist/dev"),
        },
      ],
    }),
  ],
};
