# 风格与约定
- 使用 Vue 2 单文件组件。
- 项目允许在 .vue 中使用 JavaScript（tsconfig allowJs=true），历史代码存在 JS/TS 混合。
- 保持最小改动，沿用现有组件与样式体系（UiCard、UiDialog、UiButton、UnoCSS shortcuts）。
- publicPath 使用相对路径 ./，PWA service worker 默认开启，验证页面时要注意缓存影响。
- lintOnSave=false，不能依赖编辑器自动阻止问题，改动后需手动 build/lint/浏览器验证。