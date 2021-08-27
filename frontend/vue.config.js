module.exports = {
  publicPath: '/',
  // assetsDir: 'static/frontend/',
  outputDir: '../static/frontend/',
  filenameHashing: false,
  devServer: {
    proxy:  'http://192.168.0.3:8001',
  }
}
