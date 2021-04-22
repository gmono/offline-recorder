//合成自定义文件 打包
//采用json为索引 顺序存储 json中存储位置
import * as brofs from "browserfs"
/**
 * 外部resolve的promise
 */
class PromiseSource {
    resolve;
    reject;
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
        let promisesource = new PromiseSource();
        let nargs = []
        let now = 0;
        //func.length 
        for (let i = 0; i < argnum; i++) {
            if (i == argidx) {
                //自定义b
                nargs[i] = async (...nnargs) => {
                    //参数不知
                    try {
                        let res = await getter(...nnargs);
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
let fssource = new PromiseSource();
brofs.configure({
    fs: "HTML5FS"
}, e => {
    let fs = brofs.BFSRequire();
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