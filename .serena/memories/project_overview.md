# offline-recorder 项目概览
- 目的：离线录音/多媒体记录 PWA，支持音频、视频、录屏、系统内录、历史记录、时间线笔记、断点续录与本地隐私存储。
- 技术栈：Vue 2.6.14 + Vue CLI 4 + TypeScript 4.1（allowJs）、UnoCSS、PWA/Workbox、pnpm。
- 入口：src/main.ts，主界面在 src/components/RecorderStudio.vue。
- 结构：src/components 为界面组件，src/components/ui 为基础 UI，src/libs 为录音/存储/provider 逻辑，src/styles 为主题样式，tests 为测试页/脚本。