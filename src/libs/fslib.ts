//数据操作的工具函数与类
import Stats from "browserfs/dist/node/core/node_fs_stats";
import saver from "streamsaver";
import { delay } from "ts-pystyle";
export class FSWrapper {
  constructor(public fs: FSModule) {
    this.createReadStream = this.fs.createReadStream;
    this.createWriteStram = this.fs.createWriteStream;
  }

  public async writeFile(name: string, data: Buffer) {
    console.log("id:", name);
    return new Promise<void>((r, j) => {
      this.fs.writeFile(name, data, (res) => {
        if (res) j(res);
        r();
      });
    });
  }
  public async exists(name: string) {
    return new Promise<boolean>((r, j) =>
      this.fs.exists(name, (res) => r(res))
    );
  }
  public async open(name: string, flags: string) {
    return new Promise<number | undefined>((r, j) => {
      this.fs.open(name, flags, (e, res) => {
        if (e) j(e);
        r(res);
      });
    });
  }
  /**
   *  读取文件数据
   * @param fd 文件
   * @param length 长度
   * @param pos 位置
   * @returns 数据 读取完成返回undefined
   */
  public async read(fd: number, length: number, pos: number) {
    return new Promise<Buffer | undefined>((r, j) => {
      const buf = new Buffer(length);
      this.fs.read(fd, buf, 0, length, pos, (e, f, data) => {
        if (e) j(e);
        r(data);
      });
    });
  }
  /**
   *
   * @param fd 文件
   * @param buffer 写入的数据
   * @returns 写入的
   */
  public async write(fd: number, buffer: Buffer, pos: number) {
    return new Promise<number | undefined>((r, j) => {
      this.fs.write(fd, buffer, 0, buffer.length, pos, (e, length, data) => {
        if (e) j(e);
        r(length);
      });
    });
  }

  public async fstat(fd: number) {
    return new Promise<Stats | undefined>((r, j) => {
      this.fs.fstat(fd, (e, rv) => {
        if (e) j(e);
        r(rv);
      });
    });
  }

  public async readFile(name: string) {
    return new Promise<Buffer | undefined>((r, j) => {
      this.fs.readFile(name, (e, rv) => {
        if (e) j(e);
        r(rv);
      });
    });
  }
  /**
   * 读取目录 得到文件列表
   */
  public async readdir(name: string) {
    return new Promise<string[] | undefined>((r, j) => {
      this.fs.readdir(name, (e, rv) => {
        if (e) j(e);
        r(rv);
      });
    });
  }

  public async unlink(name: string) {
    return new Promise<void>((r, j) => {
      this.fs.unlink(name, (e) => {
        if (e) j(e);
        r();
      });
    });
  }

  public async mkdir(name: string) {
    return new Promise<void>((r, j) => {
      this.fs.mkdir(name, (e) => {
        if (e) j(e);
        r();
      });
    });
  }

  public async close(fd: number) {
    return new Promise<void>((r, j) => {
      this.fs.close(fd, (e) => {
        if (e) j(e);
        r();
      });
    });
  }
  public createReadStream;
  public createWriteStram;
  //   public async createReadableStream<
  //     T extends Parameters<FSModule["createReadStream"]>
  //   >(...[path, option]: T) {
  //     return new Promise((r, j) => {
  //       this.fs.createReadStream(path, option);
  //     });
  //   }
}
export class RecorderStore {
  constructor() {}
  fs = new FSWrapper(window.require("fs"));
  buffer = window.require("buffer").Buffer;
  path = window.require("path");
  // 首先是缓存队列
  // 然后是把缓存队列写入指定文件
  public async writeToFile(name: string, blob: Blob) {
    //写入到文件
    const buf = await blob.arrayBuffer();
    const buffer = this.buffer.from(buf);
    return this.fs.writeFile(name, buffer);
  }
  /**
   * 写入一个流到文件中
   * @param name 文件名
   * @param dataFlow 要写入的数据流
   * @returns 成功返回写入的字节数
   */
  public async writeStream(name: string, dataFlow: AsyncGenerator<Blob>) {
    const fd = await this.fs.open(name, "w");
    if (fd == undefined) return false;
    let nowpos = 0;
    for await (const data of dataFlow) {
      const dt = await data.arrayBuffer();
      await this.fs.write(fd, this.buffer.from(dt), nowpos);
      nowpos += dt.byteLength;
    }
    await this.fs.close(fd);
    return nowpos;
  }

  /**
   *
   * @param name
   * @returns
   */
  public async *readAsStream(name: string) {
    const fd = await this.fs.open(name, "w");
    if (fd == undefined) return false;
    const info = await this.fs.fstat(fd);
    if (info == undefined) return null;
    const chunksize = 1000;

    for (let i = 0; i < info.size; i += chunksize) {
      console.log(i);
      const end = Math.min(info.size, i + chunksize);
      const length = end - i;
      const buf = await this.fs.read(fd, length, i);
      if (!buf) throw new Error("读取数据错误");
      yield buf.buffer;
    }
  }
  /**
   *
   * @param name 目录路径
   * @returns 目录下的所有文件,完整路径
   */
  public async getAllFiles(name: string) {
    return await this.fs.readdir(name);
  }

  public async ensureDir(name: string) {
    if (await this.fs.exists(name)) {
      return;
    } else {
      await this.fs.mkdir(name);
    }
  }
  public async readFile(name: string) {
    const r = await this.fs.readFile(name);
    if (r) {
      return new Blob([r.buffer]);
    }
    return null;
  }
  public async delFile(name: string) {
    if (await this.fs.exists(name)) {
      await this.fs.unlink(name);
    }
  }
  /**
   * 将一个文件当作媒体源使用
   * @param fd 文件
   * @returns 媒体元
   */
  private async useFileAsSource(fd: number) {
    //
    const info = await this.fs.fstat(fd);
    if (info == undefined) return null;
    const chunksize = 1000;
    const source = new MediaSource();

    source.addEventListener("sourceopen", async (e) => {
      //开始读取数据
      console.log("sourceopen");
      const buffer = source.addSourceBuffer(
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
      );
      buffer.mode = "sequence";
      buffer.addEventListener("updateend", (e) => {
        //结束
        source.endOfStream();
      });
      // buffer.appendBuffer(new ArrayBuffer(10));

      for (let i = 0; i < info.size; i += chunksize) {
        console.log(i);
        const end = Math.min(info.size, i + chunksize);
        const length = end - i;
        const buf = await this.fs.read(fd, length, i);
        if (!buf) throw new Error("读取数据错误");
        buffer.appendBuffer(buf.buffer);
        while (buffer.updating) {
          await delay(0);
        }
      }
    });
    return source;
  }

  public async getFileSource(file: string) {
    const fd = await this.fs.open(file, "r");
    if (fd == undefined) throw new Error("打开文件失败");
    const source = await this.useFileAsSource(fd);
    if (source == null) throw new Error("获取source失败");
    source.addEventListener("sourceended", async (e) => {
      await this.fs.close(fd);
    });
    return source;
  }
  /**
   * 获取文件的url
   * @param fd 文件
   * @returns 文件url
   */
  public async getFileUrl(file: string) {
    return URL.createObjectURL(await this.getFileSource(file));
  }
  public async downloadFile(name: string, downloadName: string) {
    //确保存在
    if (await this.fs.exists(name)) {
      //写入
      const file = await this.fs.open(name, "r");
      if (file) {
        //创建文件的下载url
        const writestream = saver.createWriteStream(downloadName);
        const writer = writestream.getWriter();
        //writer不一定能写buffer 可能是blob
        const stat = await this.fs.fstat(file);
        if (stat == undefined) return false;
        const length = stat.size;

        const blksize = 1000;
        for (let i = 0; i < length; i += blksize) {
          const end = Math.min(i + blksize, length);
          const l = end - i;
          const bytes = await this.fs.read(file, l, i);
          if (bytes == undefined) return false;
          await writer.write(bytes);
        }
        await writer.close();
        //返回真
        return true;
      } else return false;
    }
  }
}

function printInfo() {
  console.log(
    `调用了:${printInfo.caller.name} 参数是:${printInfo.caller.arguments}`
  );
  printInfo.caller.arguments;
}
export class FileBlob extends Blob {
  constructor() {
    super(["afsdfa"]);
  }
  async init(fname: string) {
    //打开文件 获取文件信息
    const fd = await this.fs.open(fname, "r");
    if (fd == undefined) return false;
    const info = await this.fs.fstat(fd);
    if (info == undefined) return false;
    this.info = info;
    this.filename = fname;
    await this.fs.close(fd);
  }
  fs = new FSWrapper(window.require("fs"));
  filename: string = null;
  buffer = window.require("buffer").Buffer;
  path = window.require("path");
  info: Stats | null = null;
  get type() {
    return "text/plain";
  }
  get size() {
    return this.info ? this.info.size : 0;
  }
  async arrayBuffer(): Promise<ArrayBuffer> {
    //读取文件的所有数据
    printInfo();
    if (this.filename) {
      const d = await this.fs.readFile(this.filename);
      if (d == undefined) throw new Error("错误，文件未打开");
      return d.buffer;
    }
    throw new Error("文件未设定");
  }
  async slice(start?: number, end?: number, contentType?: string): Blob {
    throw new Error("Method not implemented.");
  }
  stream(): ReadableStream<ArrayBuffer> {
    const self = this;

    if (this.filename) {
      let fd = -1;
      let nowpos = 0;
      return new ReadableStream(
        {
          cancel() {
            self.fs.close(fd);
          },
          async pull(control) {
            const size = control.desiredSize;
            if (size == null) throw new Error("错误，大小错误");
            const buf = await self.fs.read(fd, size, nowpos);
            if (buf == undefined) throw new Error("错误，读取数据错误");
            control.enqueue(buf.buffer);
            nowpos += buf.byteLength;
            if (nowpos >= self.size) control.close();
          },
          async start(control) {
            const fdd = await self.fs.open(self.filename, "r");
            if (fdd == undefined) throw new Error("错误，打开文件错误");
            fd = fdd;
            console.log("文件读取开始");
          },
        },
        {
          size(chunk: ArrayBuffer) {
            return chunk.byteLength;
          },
        }
      );
    }
    throw new Error("文件未设定");
  }
  async text(): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
