module.exports = {
  publicPath: '/',
  outputDir: '../static/frontend/',
  filenameHashing: false,
  devServer: {
    proxy:  'http://127.0.0.1:8000',
  }
}
