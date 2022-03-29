//数据操作的工具函数与类
import Stats from "browserfs/dist/node/core/node_fs_stats";
import saver from "streamsaver";
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