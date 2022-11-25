module.exports = {
  publicPath: '/',
  outputDir: '../static/frontend/',
  filenameHashing: false,
  // runtimeCompiler: true,
  devServer: {
    proxy:  'http://127.0.0.1:8000',
    port: 8080
  }
}
