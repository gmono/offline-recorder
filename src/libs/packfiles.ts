//合成自定义文件 打包
//采用json为索引 顺序存储 json中存储位置
import * as brofs from "browserfs"
/**
 * 外部resolve的promise
 */
class PromiseSource {
    resolve;
    reject;
    promise;
    constructor() {
        this.promise = new Promise((r, j) => {
            this.resolve = r;
            this.reject = j;
        })
    }
}

/**
 * 
 * @param {Function} func 
 * @param {number} argnum 
 * @param {number} argidx 
 * @param {(...args)=>Promise<any>|any} getter 
 * @returns {(...args)=>Promise<any>}
 */
function promiseify(func, argnum, argidx, getter) {
    //返回promise
    return (...args) => {
        const promisesource = new PromiseSource();
        const nargs = []
        const now = 0;
        //func.length 
        for (let i = 0; i < argnum; i++) {
            if (i == argidx) {
                //自定义b
                nargs[i] = async (...nnargs) => {
                    //参数不知
                    try {
                        const res = await getter(...nnargs);
                        promisesource.resolve(res)
                    } catch (e) {
                        promisesource.reject(e);
                    }
                }
            }
            else nargs[i] = a;
        }
        func(...nargs)
        return promisesource.promise;
    }
}
const fssource = new PromiseSource();
brofs.configure({
    fs: "HTML5FS"
}, e => {
    const fs = brofs.BFSRequire();
    fssource.resolve(fs);
})
/**
 * 构建 渐进式 不是一次提供所有文件
 * 使用html5fs后端
 * 
 */
class PackageBuilder {
    constructor() { }
    //fs模块
    /**
     * @type {typeof import('fs')}
     */
    fs;
    packfile;
    /**
     * 
     * @param {string} packname 
     */
    async init(packname) {
        //创建文件
        this.fs = await fssource;
        await promiseify(this.fs.open,3,2,(e,fd)=>fd)("./pack.pak","w");
        // this.fs.open("./pack.pak", "w", (e, fd) => this.packfile = fd);
    }
    //这是文件索引 json写入到文件
    //生成数据体然后把文件索引写入到数据体末端 并最最后一个字节附加上长度
    filemap = {}
    addFile(name, blob) {
        //使用filesystem api
    }
    build() {

    }
}

class PromiseMe{
    cbk=null;
    //
    state="waiting";
    data=null;
    errobj=null
    resolve=(data)=>{
        this.state="returned";
        this.data=data;
        if(this.cbk!=null) this.cbk(this.data);
    }
    reject=(err)=>{
        this.state="error";
        this.errobj=err;
        if(this.err!=null) this.err(this.errobj);
    };
    constructor(func){
        //调用 传入回调
        func(this.resolve,this.reject);
    }
    then(cbk){
        this.cbk=cbk;
        if(this.state=="returned"){
            this.cbk(this.data);
        }
    }
    err;
    catch(e){
        this.err=e;
        if(this.state=="error"){
            this.err(this.errobj);
        }
    }
    
}

new PromiseMe((r,j)=>{
    setTimeout(() => {
        r("hello")
    }, 2000);
}).then(c=>console.log(c))