下一步：

更改数据处理流程，不在内存中保存数据，将 blobs 和 mergeBlob 都变为对 fs 的引用  
将融合操作变为写入文件流操作 将

# 步

下载直接使用 async 生成器+streamsaver 实现，目前问题是使用流式播放，播放 idb 中和文件中的媒体
如果无法播放，考虑更换媒体播放器,或者通过手动解码和 canvas 绘制
goldplayer

最终 sourceurl
https://github.com/goldvideo/h265player/blob/master/src/loader/HLSLoader.js
追踪 sourceurl

1. 不改变代码的情况下添加测试性的直接写入代码 ok
2. 消除 mergeblob 的作用,让 src 指向另一个
   创建 Fileblob url 成功，尝试从中下载数据
3. 删除之前的代码并保持兼容
4. 公开对外接口： 列表 缓存队列
5. 改进缓存队列，使用 fslib 的文件写入功能实现缓存，并优化缓存队列的读写性能，添加一次获取多个 block 的功能
6. 添加新类型笔记：任务，并可以点击完成
7. 改进笔记功能，笔记数据类型改为 any，并允许 NoteLabel NoteView NoteTypeID NoteLabelPlane（笔记操作面板） 一一对应，允许插件化添加不同笔记功能
8. 优化了笔记列表的布局
9. 根据不同笔记类型 id，来提供不同的排列方式，如混合排列或单独 列出某一类，添加 dock 和拖动功能，让笔记操作面板在 dock 中，并允许某一类笔记自己提供自己的操作面板而不依赖系统来显示 label
