import { len } from "ts-pystyle";
import { IBucket, ISequence } from "../commom";


export class PackedSequenceBucket implements IBucket {
  constructor(protected seq: ISequence) {

  }
  async push(blob: Blob) {
    await this.seq.pushToStart(blob)
  }
  async getSequenceURL() {
    //使用媒体流创
    let t = new MediaSource();
    t.addEventListener("sourceopen", async (e) => {
      let buffer = t.addSourceBuffer("video/webm")
      let len = await this.seq.length();
      //一次性放进去
      for (let i = 0; i < len; ++i){
        let item = await this.seq.get(i);
        buffer.appendBuffer(await item.arrayBuffer())
      }
    })
    return URL.createObjectURL(t);
  }
  async getConcatBlob() {
    let len = await this.seq.length();
    let arr=[]
    for (let i = 0; i < len; ++i){
      arr.push(await this.seq.get(i))
    }
    return new Blob(arr)
  }

}

