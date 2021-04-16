import { clear, del, update } from "idb-keyval";
import _ from "lodash";
import { error } from "ts-pystyle";
import { Store } from "vuex";
const has = async (name) => await get(name) != null;

//store
const itemStore = createStore("recording", "items");
const itemInfoStore = createStore("recording", "infos");
//操作store的函数
async function itemNameList() {
    return await keys(itemInfoStore);
}
/**
 * 
 * @returns {{[idx:string]:ReturnType<typeof newRecordingInfo>}}
 */
async function itemInfos() {
    return await (await entries(itemInfoStore)).reduce((prev, curr) => prev[curr[0]] = curr[1], {})
}

/**
 * 获取一个Item的blob对象 数据
 */
export async function getItemBlob(name) {
    let res = await get(name, itemStore);
    if (res) return res;
    else return null;
}

async function storeItem(info, blob) {
    let name = info.name;
    try {
        await set(name, blob, itemStore);
        await set(name, info, itemInfoStore);
    }
    //还应该回滚
    catch (e) { return null; }
    return true;
}

async function removeItem(id) {
    await del(id, itemStore);
    await del(id, itemInfoStore);
}

async function updateInfo(id, info) {
    await update(id, (old) => info, itemInfoStore);
}

async function clearStores() {
    await clear(itemInfoStore);
    await clear(itemStore);
}

export default () => new Store({
    state: {
        //初始化获取数据 从store中
        //name->info
        isInited: false,
        historyInfos: null
    },
    getters: {
        //历史索引
        historyIdxs(state) {
            return _.keys(state.historyInfos)
        }
    },
    mutations: {
        /**
         * 添加一个历史记录（只修改状态）
         */
        addHistoryItem(state, info) {
            if (this.state.isInited == false) {
                error("错误，还没初始化");
            }
            state.historyInfos[info.name] = info;
        },
        initHistoryInfo(state, initinfos) {
            if (state.isInited) console.warn("重复提交初始化更改")
            state.isInited = true;
            state.historyInfos = _.cloneDeep(initinfos);
        },
        removeItem(state, id) {
            if (this.state.isInited == false) {
                error("错误，还没初始化");
            }
            if (id in state.historyInfos) {
                delete state.historyInfos[id];
            }
        },
        updateInfo(state, { id, newInfo }) {
            if (this.state.isInited == false) {
                error("错误，还没初始化");
            }
            if (id != newInfo.id) error("不能更新Item的id，id不可更改")
            if (id in state.historyInfos) {
                state.historyInfos[id] = newInfo;
            }
        }
    },
    actions: {
        async pushHistory(state, item) {
            //实际添加保存 并提交一个更改到store
            let { info, blob } = item;
            //执行保存并添加更改
            await storeItem(info, blob);
        },
        async removeHistory(state, id) {
            await removeItem(id);
        },
        async renameHistory(state, { id, newName }) {
            if (this.state.isInited == false) {
                error("错误，还没初始化");
            }
            let oldinfo = this.state.historyInfos[id];
            oldinfo.name = newName;
            this.commit("updateInfo", oldinfo);
        },
        async clearHistory(state) {
            await clearStores();
        },
        /**
         * 使用历史记录之前必须先调用此函数
         */
        async initHistory() {
            if (this.state.isInited) return;
            let infos = await itemInfos();
            this.commit("initHistoryInfo", infos);
        },


    }
})