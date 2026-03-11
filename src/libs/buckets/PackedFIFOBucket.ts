import { len } from "ts-pystyle";
import { IBucket, ISequence } from "../commom";


export class PackedSequenceBucket implements IBucket {
  constructor(protected seq: ISequence, protected mimeType = "video/webm") {

  }
  async push(blob: Blob) {
    await this.seq.pushToEnd(blob)
  }
  async getSequenceURL() {
    //使用媒体流创
    let t = new MediaSource();
    t.addEventListener("sourceopen", async () => {
      let buffer = t.addSourceBuffer(this.mimeType)
      let len = await this.seq.length();
      //一次性放进去
      for (let i = 0; i < len; ++i){
        let item = await this.seq.get(i);
        buffer.appendBuffer(await item.arrayBuffer())
        if (buffer.updating) {
          await new Promise<void>((resolve) => {
            const onUpdateEnd = () => {
              buffer.removeEventListener("updateend", onUpdateEnd);
              resolve();
            };
            buffer.addEventListener("updateend", onUpdateEnd);
          });
        }
      }
      if (t.readyState === "open") {
        t.endOfStream();
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
    return new Blob(arr, { type: this.mimeType })
  }

}

