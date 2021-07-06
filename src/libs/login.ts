/**
 * 管理登录等事务
 * 目前通过用户名和密码生成hash并可通过generate函数生成各种key的hash key
 * 比如临时缓存
 */
import * as hash from "hash.js"
import * as ase from "aes-js"
import { IndexedDBStorage } from "./storages/IndexedDBStorage";

const userlistkey = hash.sha256().update("userlist").digest("hex");
/**
 * 使用本地校验的登录管理器 
 * 本地存储用户列表 和 密码校验数据
 */
export class LoginManager{
  /**
   * map username->key
   * key原始数据为以密码的sha256 为key对username进行加密得到的
   */
  protected userlist=new IndexedDBStorage(userlistkey)
  constructor() {
    
  }
  public hasUser(username: string) {
    return this.userlist.hasBlock(username);
  }
  //注册登录
  public async register(username:string,password:string) {
    if (this.hasUser(username)) {
      throw new Error("用户已存在");
    }
    else {
      //注册用户
      //生成校验码
      let raw = username;
      let key=hash.sha256().update(password).digest()
      let enc = new ase.ModeOfOperation.ctr(key);
      let encdata = new Blob([enc.encrypt(ase.utils.utf8.toBytes(raw))]);
      //存储到用户列表 校验数据 到时候需要解密得到实际的用户名对比后才能确认成功
      await this.userlist.pushBlock(username, encdata);
    }
  }
  protected getKeyGen(username:string,password:string) {
    return new KeyGenerator(username, password);
  }
  public async  login(username:string,password:string) {
    if (this.hasUser(username)) {
      //获取校验数据 解密 对比
      let encdata =await this.userlist.getBlock(username);
      let key = hash.sha256().update(password).digest()
      let enc = new ase.ModeOfOperation.ctr(key);
      try {
        let raw = ase.utils.utf8.fromBytes(enc.decrypt(await encdata.arrayBuffer()))
        if (raw == username) {
          return this.getKeyGen(username, password);
        } else throw new Error("密码错误")
      } catch (e) {
        throw new Error("密码错误");
      }
    }else return new Error("不存在这个用户")
  }
}
export class KeyGenerator{
  constructor(protected username: string, protected password: string) {
    
  }
  login(username: string, password: string) {
    this.password = password;
    this.username = username;
  }
  generate(key: string):string {
    return  hash.sha256().update(`__${this.username}__${this.password}__${key}`).digest("hex")
  }
  /**
   * 
   * @param key 原始的key
   * @returns 加密的key 使用用户名加密 可以被公开读取
   */
  generatePublicInfoKey(key: string): string{
    //只使用username和key 生成 这样其他人得到用户名和key也可以获取信息 用于公开信息
    return hash.sha256().update(this.username + key).digest("hex");
  }
  /**
   * 
   * @param blob 数据
   * @returns 加密后数据
   */
  async encrypto(blob: Blob) {
    //生成sha256 key
    let enc = new ase.ModeOfOperation.ctr(ase.utils.hex.toBytes(this.generate("encrypto")));
    let res = enc.encrypt(await blob.arrayBuffer())
    if (res instanceof Array) {
      return new Blob(res)
    }
    else return new Blob([res])
  }
/**
 * 解密
 * @param blob 已经加密的数据
 * @returns 原始数据
 */
  async decrypto(blob: Blob) {
    let enc = new ase.ModeOfOperation.ctr(ase.utils.hex.toBytes(this.generate("encrypto")));
    let res = enc.decrypt(await blob.arrayBuffer())
    if (res instanceof Array) {
      return new Blob(res)
    }
    else return new Blob([res])
  }
}