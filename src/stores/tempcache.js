
//temp cache 管理

import { Store } from "vuex";

//表示是否存在残留的临时缓存  如果有表示需要继续
const tempCache = createStore("recording", "tempcache");
//用于保存使用中的临时缓存的长度
//状态：使用中|未使用  使用中的状态在内存中 未使用 即进页面时需要检测 并
const nowLength = 0;
/**
 * @type {'using'|'nouse'}
 */
const cacheState = "nouse";
async function hasTempCache() {
    return await get(0, tempCache);
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
    let l = await lengthOfCache();
    nowLength = l;
    let ret = [];
    for (let a of range(l)) {

        ret.push(await get(a, tempCache));

    }
    cacheState = "using";
    return ret;
}


async function pushToCache(blob) {
    await set(nowLength++, blob)
}
/**
 * 清理临时缓存
 */
async function clearCache() {
    for (let a of range(await lengthOfCache())) {
        await del(a, tempCache);
    }
}

export default ()=>new Store({
    state:{
        //与上面的nowLength同步 只在commit时更改
        nowCacheLength:0
    },
    mutations:{
        itemAdded(state){
            state.nowCacheLength++;
        }
    },
    actions:{
        async pushItem(state,blob){
            await pushToCache(blob);
            this.commit("itemAdded")
        }
    }
})