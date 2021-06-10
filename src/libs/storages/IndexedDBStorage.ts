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
import { IStorage } from "../commom";


//这里设定接口



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



//简单包装的体系 




//这里开始考虑