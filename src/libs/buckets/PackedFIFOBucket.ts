import { IBucket, IFIFO } from "../commom";

class PackedFIFOBucket implements IBucket{
  constructor(protected fifo: IFIFO) {
    
  }
  async push(blob: Blob) {
    await this.fifo.push(blob)
  }
  async getSequenceURL() {
    //使用媒体流创
    let stream = new ReadableStream({
      start() {
        
      },
      pull() {
        
      }
    })
    let url=window.URL.createObjectURL(stream)

  }
  async getConcatBlob() {
    return new Blob([])
  }

}

