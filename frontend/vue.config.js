module.exports = {
  publicPath: '/',
  outputDir: '../static/frontend/',
  filenameHashing: false,
  devServer: {
    proxy:  'http://192.168.1.3:8001',
  }
}
