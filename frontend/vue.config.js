module.exports = {
  publicPath: (process.env.NODE_ENV === 'production' ? '/static/frontend/' : '/'),
  outputDir: '../static/frontend/',
  filenameHashing: false,
  // runtimeCompiler: true,
  devServer: {
    proxy:  'http://'+ process.env.PROXY_SERVER +':' + process.env.PROXY_PORT,
    port: 8080
  }
}
