# recorder

## 注意
本项目会不定期更新，为防止出现bug丢失数据，可以clone到本地后在本机运行，或fork仓库后自己部署pages运行
**在开发测试后就会发布新版本**
## 说明
离线录音机，使用浏览器存储，可离线保存数据，保证数据不丢失，免去在线录音机刷新丢失所有数据的问题，实现自动缓存并防止录音失败后丢失数据（out of memory等）
## 功能实现
- [x] 录音
- [x] 多媒体录制
  - [x] 视频录制
  - [x] 录屏
  - [x] 电脑内录音
- [x] 播放器
- [x] 播放列表
- [ ] **核心数据结构转移到vuex，进行中** 
- [ ] 自动保存机制
- [x] 实时缓存
- [x] 下载所有
  - [x] 打包下载所有（自动压缩为zip)
- [x] 添加笔记功能，与时间线结合（在timeSpan数据结构中添加note字段）

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
