/**
 * 存储器接口 提供简单的 按id 添加 删除 等功能
 * 数据类型为blob
 * 
 * 
 * 本身实现主要实现存储功能，无论是数据库还是云端还是文件还是其他什么
 * 甚至redis rbq memcached等都可以  用分布式存储都可以
 * 向两个方向包装
 * 1 支持更多数据类型 如 objectStorage 对象存储
 * 2 支持更多操作类型 如 FIFOStorage 存储队列
 */
export interface IStorage {
  //存储器接口
  pushBlock(id: string, blob: Blob): Promise<void>;
  removeBlock(id: string): Promise<void>;
  hasBlock(id: string): Promise<boolean>;
  getBlock(id: string): Promise<Blob>;
  updateBlock?(id: string, blob: Blob): Promise<void>;
}
/**
 * 数组接口 可以自由访问和删除
 */
export interface ISequence {
  pushToStart(blob: Blob): Promise<void>;
  pushToEnd(blob: Blob): Promise<void>;
  get(idx: number):Promise<Blob>;
  set(idx: number, blob: Blob): Promise<void>;
  removeEnd(): Promise<void>;
  removeStart(): Promise<void>;
  //长度
  length(): Promise<number>;
}




export interface IBucket {
  //只放不能拿
  push(blob: Blob): Promise<void>;
  /**
   * 获取桶中所有数据的URL（流式下载）
   */
  getSequenceURL(): Promise<string>;
  /**
   * 内存中合并为一个大的blob并返回
   */
  getConcatBlob(): Promise<Blob>;
}
