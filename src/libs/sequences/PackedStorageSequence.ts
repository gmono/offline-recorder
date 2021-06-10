import { ISequence, IStorage } from "../commom";

class PackedStorageSequence implements ISequence{
  constructor(protected storage: IStorage) {
    
  }
  length: number = 0;
  async push(blob: Blob): Promise<void> {
    //存储
    await this.storage.pushBlock(this.length.toString(), blob);
    this.length++;
  }
  async get(idx: number): Promise<Blob> {
    if (idx < this.length) {
      return await this.storage.getBlock(idx.toString())
    }
    throw new Error("idx越界");
  }
  async set(idx: number, blob: Blob): Promise<void> {
    if(this.storage.updateBlock)
      await this.storage.updateBlock(idx.toString(), blob);
    throw new Error("存储器不支持覆写")
  }
  async pop(): Promise<void> {
    if (this.length == 0) throw new Error("已经到底");
    this.length--;
    await this.storage.removeBlock(this.length.toString());
  }

}