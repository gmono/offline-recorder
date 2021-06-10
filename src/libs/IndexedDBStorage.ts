/**
 * 使用对象存储数据库来存储
 * 概念：
 *    一个录音是一个bucket ，bucket可以不断添加blob 
 *    bucket可以创建url
 * 实现
 *    一个bucket就是一个目录，有一个id，里面存了很多item，同时在另一个数据库中存储了它的信息，通过id索引
 *    添加blob时就往bucket中添加blob，并记录顺序
 *    创建url时通过mediastream来创建，动态的添加data
 */

import { createStore, get, set, UseStore,del } from "idb-keyval";
import { error } from "ts-pystyle";


//这里设定接口

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
interface IStorage {
  //存储器接口
  pushBlock(id: string, blob: Blob): Promise<void>;
  removeBlock(id: string): Promise<void>;
  hasBlock(id: string): Promise<boolean>;
  getBlock(id: string): Promise<Blob>;
  updateBlock?(id: string, blob: Blob): Promise<void>;
}

/**
 * 使用indexeddb实现的存储类
 */
export class IndexedDBStorage implements IStorage {
  store: UseStore | null = null;
  constructor(name: string) {
    this.store = createStore(name, name)
  }
  async hasBlock(id: string): Promise<boolean> {
    if (this.store)
      //存储到idbstore
      return (await get(id, this.store)) ===undefined;
    else throw new Error("错误，没有初始化")
  }
  async getBlock(id: string): Promise<Blob> {
    if (this.store)
      //存储到idbstore
    {
      let ret = await get(id, this.store);
      if (ret) return ret;
      else throw new Error("没有这个项");

    }
    else throw new Error("错误，没有初始化")
  }
  async pushBlock(id: string, blob: Blob): Promise<void> {
    if (this.store)
      //存储到idbstore
      await set(id, blob, this.store)
    else throw new Error("错误，没有初始化")
  }
  async removeBlock(id: string): Promise<void> {
    if (this.store)
      //存储到idbstore
      await del(id, this.store);
    else throw new Error("错误，没有初始化")

  }

}

/**
 * 数组接口
 */
export interface ISequence{
  push(blob: Blob);
  get(idx: number);
  set(idx: number, blob: Blob);
  pop(): void;
}


/**
 * 队列接口 一般队列基于数组
 */
export interface IFIFO{
  //队列
  push(blob: Blob);
  pop(): Blob;
}

export interface IBucket{
  //只放不能拿
  push(blob: Blob):void;
  /**
   * 获取桶中所有数据的URL（流式下载）
   */
  getSequenceURL(): string;
  /**
   * 内存中合并为一个大的blob并返回
   */
  getConcatBlob(): Blob;
}
