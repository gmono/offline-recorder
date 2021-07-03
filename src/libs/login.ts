/**
 * 管理登录等事务
 * 目前通过用户名和密码生成hash并可通过generate函数生成各种key的hash key
 * 比如临时缓存
 */
import encrypt from "crypto-js/sha256"

export class KeyGenerator{
  constructor(protected username: string, protected password: string) {
    
  }
  login(username: string, password: string) {
    this.password = password;
    this.username = username;
  }
  generate(key: string):string {
    let raw = encrypt(this.username + this.password + key).toString();
    return raw;
  }
  generatePublicInfoKey(key: string): string{
    //只使用username和key 生成 这样其他人得到用户名和key也可以获取信息 用于公开信息
    return encrypt(this.username + key).toString();
  }
}