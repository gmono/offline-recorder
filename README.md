# recorder

注意，本软件为 pwa 自动更新，如果要使用某个特定版本，如为保存某些重要数据，请 clone 并本地执行

## 说明

离线可用的记录工具，拥有笔记记录，任务记录（开发中）等功能，使用浏览器存储
断电，关闭浏览器或录音时间过长超出内存等问题，都不丢失数据，重新打开继续录
数据保存在浏览器中，存储在本地电脑上，保护隐私
支持同时录多份录音文件，不会出现不下载就消失的情况
在线播放器，可在线预览，选择下载
自动记录额外信息，如录音时间段，长度大小等
**可添加为 WebApp（打开 Chrome 浏览器点击地址栏右侧“安装 recorder"，手机可打开手机版 Chrome 后，根据底部提示操作）**

## 功能实现

- [x] 录音
- [x] 多媒体录制
  - [x] 视频录制
  - [x] 录屏
  - [x] 电脑内录音
- [x] 播放器
- [x] 播放列表
- [ ] **核心数据结构转移到 vuex，进行中**
- [x] 自动保存机制
- [x] 实时缓存
- [x] 下载所有
  - [x] 打包下载所有（自动压缩为 zip)
- [x] 添加笔记功能，与时间线结合（在 timeSpan 数据结构中添加 note 字段）

## 下一步

手机端自适应布局，和自动切换组件库
自动同步到云端

## Project setup

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn serve
```

### Compiles and minifies for production

```
yarn build
```

### Lints and fixes files

```
yarn lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
