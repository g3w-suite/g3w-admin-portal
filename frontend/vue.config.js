module.exports = {
  publicPath: '/',
  outputDir: '../static/frontend/',
  filenameHashing: false,
  // runtimeCompiler: true,
  devServer: {
    proxy:  'http://'+ process.env.PROXY_SERVER +':' + process.env.PROXY_PORT,
    port: 8080
  }
}
