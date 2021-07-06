/**
 * 管理登录等事务
 * 目前通过用户名和密码生成hash并可通过generate函数生成各种key的hash key
 * 比如临时缓存
 */
import * as hash from "hash.js"
import * as ase from "aes-js"
export class KeyGenerator{
  constructor(protected username: string, protected password: string) {
    
  }
  login(username: string, password: string) {
    this.password = password;
    this.username = username;
  }
  generate(key: string):string {
    let raw = hash.sha256().update(this.username + this.password + key).digest("hex");
    return raw;
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
   * @returns 用于加密的key 有密码参与
   */
  protected generateEncrptyKey(key:string):string {
      return  hash.sha256().update(`__${this.username}__${this.password}__${key}`).digest("hex")
  }
  /**
   * 
   * @param blob 数据
   * @returns 加密后数据
   */
  async encrypto(blob: Blob) {
    //生成sha256 key
    let enc = new ase.ModeOfOperation.ctr(ase.utils.hex.toBytes(this.generateEncrptyKey("encrypto")));
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
    let enc = new ase.ModeOfOperation.ctr(ase.utils.hex.toBytes(this.generateEncrptyKey("encrypto")));
    let res = enc.decrypt(await blob.arrayBuffer())
    if (res instanceof Array) {
      return new Blob(res)
    }
    else return new Blob([res])
  }
}