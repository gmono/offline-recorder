/**
 * 管理登录等事务
 * 目前通过用户名和密码生成hash并可通过generate函数生成各种key的hash key
 * 比如临时缓存
 */


export class KeyGenerator{
  constructor(protected username: string, protected password: string) {
    
  }
  login(username: string, password: string) {
    this.password = password;
    this.username = username;
  }
  generate(key: string):string {
    let raw = this.username + this.password + key;
    return raw;
  }
}