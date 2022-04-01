// vue.config.js

/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  // 选项...
  publicPath: "./",
  lintOnSave: false,
  parallel: true,
  productionSourceMap: false,
  pwa: {
    name: "通用记录器",
    themeColor: "#f5871f",
    msTileColor: "#000000",
    appleMobileWebAppCapable: "yes",
    appleMobileWebAppStatusBarStyle: "black",

    // // 如果想要自己寫 service-worker.js
    // // configure the workbox plugin
    // workboxPluginMode: 'InjectManifest',
    // workboxOptions: {
    //   // swSrc is required in InjectManifest mode.
    //   swSrc: 'src/service-worker.js',
    //   // ...other Workbox options...
    // },

    // 如果想要讓他自己生產
    workboxPluginMode: "GenerateSW",
    workboxOptions: {
      // 不等待 terminated 直接取代舊的 service-worker
      // 解決無法自動更新的問題
      skipWaiting: true,
    },
  },
};
