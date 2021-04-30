# recorder

## 注意
本项目会不定期更新，为防止出现bug丢失数据，可以clone到本地后在本机运行，或fork仓库后自己部署pages运行
**在开发测试后就会发布新版本**
## 说明
离线录音机，使用浏览器存储，可离线保存数据，保证数据不丢失，免去在线录音机刷新丢失所有数据的问题，实现自动缓存并防止录音失败后丢失数据（out of memory等）
## 功能计划
- [x] 录音
- [x] 播放器
- [x] 播放列表
- [ ] 云存储
- [x] 实时缓存
- [ ] 自适应布局
- [x] 下载所有
  - [x] 打包下载所有（自动压缩为zip)
- [ ] 非内存缓存队列(放弃数组缓存 使其不受制于内存大小)，直接使用indexeddb做缓存队列且不读取到内存中，在内存中只记录一个当前队列长度(并作为recording info的一部分保存在localstorage中)，接收到数据直接放入数据库，并修改当前长度，所有对blobs数组的操作转换为对blobslength的操作
  - [ ] 解决合并时需要读取blobs到内存中进行合并的问题（流式合并）
    - [ ] 方案1：不合并，而是直接记录总大小，在下载时直接通过媒体流接口从数据库提供数据
    - [ ] 方案2：通过filesystemapi ，顺序写入到sandbox文件中，直接记录文件名和总大小，下载时直接从文件系统中下载
- [ ] 放弃使用内存中merge的方式，而是直接缓存队列到存储，并在下载时以媒体流方式提供数据
- [ ] 空白过滤（通过对每秒的帧进行测试（头帧除外），如果音量平均低于阈值直接放弃）
- [ ] 高级空白过滤，直接对音频数据进行截取，去除音量低于阈值的并重新合成新的帧（足够长度的片段），如果一个足够
- [ ] 长度的片段都没有直接放弃这一帧
- [ ] 添加 标记 按钮，给timeSpan列表添加项，为当前录音长度（整数），允许手动添加，和在暂停时自动添加
- [ ] 监听页面信息，在页面休眠时自动添加标记
- [ ] 允许下载信息文件（json)，在下载媒体文件时自动下载
- [ ] 使用React hook+antd+umi重制
- [x] 添加笔记功能，与时间线结合（在timeSpan数据结构中添加note字段）
- [ ] ui上用时间线显示笔记序列（timeSpan序列），允许点击跳转）(进行中）
- [ ] **核心数据结构转移到vuex，进行中** 
- [ ] 添加个人中心，用来显示本地保存的信息
- [ ] 通过空格键添加标记
- [ ] 拆分组件
- [ ] 播放列表单独滚动
- [ ] 继续时忽略第一帧（非正常暂停后开始录制时，忽略第一帧文件头，延迟一秒开始录制）（显示“正在启动继续录制”按钮改为“继续上次录制”）
- [ ] 通过保存的recording信息中的recording字段判断是否正在录制，而非使用判断缓存是否为空
- [ ] 延迟清理缓存策略
  - [ ] 保存当前使用的缓存队列长度（当前blobs长度）
  - [ ] 清空缓存时采用异步循环
  - [ ] 缓存清空只清空到当前队列长度位置
  - [ ] 考虑两个清空函数正在运行的清空（后面的清空函数需要判断是否has 后再del
- [ ] 使用数据管理器，解决内存泄漏问题
- [ ] 采用一种新的录制格式，以避免断点续录时的格式问题
  - [ ] 使用zip打包多个区段的webm文件，并加上每个webm单独的json描述，整个zip中有一个独立的json描述
  - [ ] 打包时使用内存打包
  - [ ] 改变格式，使用自定义的数据文件格式，打包时使用html5fs写入，不限制文件大小
  - [ ] 达到一定时长自动保存一个文件
  - [ ] 播放器方面，使用自定义播放器，播放的是一个媒体流，不断按顺序往媒体流中插入数据来连续播放不同的文件
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
