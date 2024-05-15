const path = require("path");
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  productionSourceMap: true,
  transpileDependencies: true,

  devServer: {
    static: { 
      directory: path.resolve(__dirname, './src/assets/charting_library'), 
      publicPath: '/charting_library'
    },
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
})
