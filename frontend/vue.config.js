const path = require("path");
const { defineConfig } = require('@vue/cli-service')
const fs = require("fs");

const config = {
  productionSourceMap: true,
  transpileDependencies: true,

  devServer: {
    client: {
      overlay: {
        runtimeErrors: (error) => {
          const ignoreErrors = [
            "ResizeObserver loop limit exceeded",
            "ResizeObserver loop completed with undelivered notifications.",
          ];
          if (ignoreErrors.includes(error.message)) {
            return false;
          }
          return true;
        },
      },
    },
  },
}

if (fs.existsSync('./src/assets/charting_library')) {
  config.devServer.static = { 
    directory: path.resolve(__dirname, './src/assets/charting_library'), 
    publicPath: '/charting_library'
  }
}

module.exports = defineConfig(config)
