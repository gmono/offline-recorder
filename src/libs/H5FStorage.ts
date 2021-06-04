/**
 * 使用html5文件系统来进行存储
 * 修改：
 *  操作：
 *    创建存储桶
 *    设定存储桶的信息（id
 *    在存储桶中提交block（blob）
 *    关闭存储桶（保存 
 * 
 * 读取操作：
 * 列出所有存储桶
 * 获取某个存储桶的数据（blob） 
 * 获取某个存储桶的URL（可以下载的）
 */

/**
 * 
 * @param size 空间大小  默认 1G 单位字节
 * @param 
 * @param 
 * @param 
 * @param */
async function requireFileSystem(size = 1 * 1000 * 1000 * 1000) {
  let ret = new Promise<FileSystem>((r, j) => {
    window.requestFileSystem(window.PERSISTENT, size, (f) => {
      r(f)
    }, (ee) => {
      j(ee)
    })
  })
  return ret;
}

const filesystem = requireFileSystem();
/**
 * 桶 代表一个html5文件
 */
class Bucket {
  constructor() {

  }
  public appendData(blob: Blob) {

  }
  public removeData(size: number) {
    //从末尾删除多少字节 暂不实现
  }
  public readAllData(): ArrayBufferLike {

  }
  public getURL(): string {

  }

}

export class H5FSStorage {
  constructor(basedir:string) {

  }
  private getPath(path: string) {
    
  }
  public async createBucket(id: string): Bucket {
    const files = await filesystem;
  }
  /**
   * 关闭一个存储桶  关闭后才能进行后续操作
   * 如 获取全部数据  获取URL  通过其他的Storage进行操作（云备份等）
   * @param id 桶id
   */
  public closeBucket(id: string): void {

  }
  /**
   * 
   * @param filter 过滤器 用来通过id来判断是否选择这个桶
   */
  public selectBucket(filter: (id: string) => boolean) {

  }
}

