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
