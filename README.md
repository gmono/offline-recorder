# recorder
## 说明
离线录音机，使用浏览器存储，可离线保存数据，保证数据不丢失，免去在线录音机刷新丢失所有数据的问题，实现自动缓存并防止录音失败后丢失数据（out of memory等）
## 功能计划
- [x] 录音
- [x] 播放器
- [x] 播放列表
- [ ] 云存储
- [x] 实时缓存
- [ ] 自适应布局
- [ ] 非内存缓存队列(放弃数组缓存 使其不受制于内存大小)
- [ ] 放弃使用内存中merge的方式，而是直接缓存队列到存储，并在下载时以媒体流方式提供数据
- [ ] 空白过滤（通过对每秒的帧进行测试（头帧除外），如果音量平均低于阈值直接放弃）
- [ ] 高级空白过滤，直接对音频数据进行截取，去除音量低于阈值的并重新合成新的帧（足够长度的片段），如果一个足够长度的片段都没有直接放弃这一帧
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
