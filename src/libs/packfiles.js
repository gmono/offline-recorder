//合成自定义文件 打包
//采用json为索引 顺序存储 json中存储位置
import * as brofs from "browserfs"
/**
 * 构建 渐进式 不是一次提供所有文件
 * 使用html5fs后端
 * 
 */
class PackageBuilder{
    constructor(){}
    //这是文件索引 json写入到文件
    //生成数据体然后把文件索引写入到数据体末端 并最最后一个字节附加上长度
    filemap={}
    addFile(name,blob){
        //使用filesystem api
    }
    build(){

    }
}