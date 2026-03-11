
//temp cache 管理

import { createStore, get, del, keys, set } from "idb-keyval";
import { range } from "ts-pystyle";

//表示是否存在残留的临时缓存  如果有表示需要继续
const tempCache = createStore("recording", "tempcache");
//用于保存使用中的临时缓存的长度
//状态：使用中|未使用  使用中的状态在内存中 未使用 即进页面时需要检测 并
let nowLength = 0;
/**
 * @type {'using'|'nouse'}
 */
let cacheState: "using" | "nouse" = "nouse";
async function hasTempCache() {
    return (await get(0, tempCache)) != null;
}
async function lengthOfCache() {
    //可缓存长度
    if (cacheState == 'nouse')
        return (await keys(tempCache)).length;
    else return nowLength;
}


/**
 * 恢复缓存 读取并返回一个blobs 同时加载上次使用临时缓存的信息
 * 返回一个blobs
 */
async function restoreTempCache() {
    //获取临时缓存 作为一个列表
    const l = await lengthOfCache();
    nowLength = l;
    const ret = [];
    for (const a of range(l)) {

        ret.push(await get(a, tempCache));

    }
    cacheState = "using";
    return ret;
}


async function pushToCache(blob) {
    await set(nowLength, blob, tempCache);
    nowLength += 1;
}
/**
 * 清理临时缓存
 */
async function clearCache() {
    for (const a of range(await lengthOfCache())) {
        await del(a, tempCache);
    }
    nowLength = 0;
    cacheState = "nouse";
}

export default () => ({
    state:{
        //与上面的nowLength同步 只在commit时更改
        nowCacheLength:0,
        
    },
    mutations:{
        itemAdded(state){
            state.nowCacheLength++;
        },
        cacheCleared(state) {
            state.nowCacheLength = 0;
        }
    },
    actions:{
        async pushItem(context,blob){
            await pushToCache(blob);
            context.commit("itemAdded")
        },
        async clearCache(context){
            await clearCache();
            context.commit("cacheCleared");
        },
        async restore(context) {
            const blobs = await restoreTempCache();
            context.commit("cacheCleared");
            context.state.nowCacheLength = blobs.length;
            return blobs;
        }
    }
})