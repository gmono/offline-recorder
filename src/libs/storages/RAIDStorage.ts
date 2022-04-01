/**
 * 类似raid的备份存储，按顺序排列几个storage，以第一个为主体，存储到第一个中，并在同时把存储命令分发到其他
 * storage 当第一个数据不可用或错误时，按顺序使用备份存储提供数据并尝试恢复第一级的数据
 * 存储数据的同时会存储数据的crc校验到 key_crc中
 */

import { IStorage } from "../commom";

//这里设定接口

/**
 * 代理存储 支持crc校验并自动备份数据
 */
export class RAIDStorage implements IStorage {
  constructor(public storageQueue: IStorage[]) {}
  get mainStorage() {
    return this.storageQueue[0];
  }
  async entities(): Promise<[string, Blob][]> {
    return this.mainStorage.entities();
  }
  async clear(): Promise<void> {
    return this.mainStorage.clear();
  }
  async count(): Promise<number> {
    return this.mainStorage.count();
  }
  async hasBlock(id: string): Promise<boolean> {
    return this.mainStorage.hasBlock(id);
  }
  async getBlock(id: string): Promise<Blob> {
    return this.mainStorage.getBlock(id);
  }
  async pushBlock(id: string, blob: Blob): Promise<void> {
    return this.mainStorage.pushBlock(id, blob);
  }
  async removeBlock(id: string): Promise<void> {
    return this.mainStorage.removeBlock(id);
  }
}

//简单包装的体系

//这里开始考虑
