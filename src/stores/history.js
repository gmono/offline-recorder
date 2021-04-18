import { clear, del, update, createStore, entries, keys,set,get } from "idb-keyval";
import _ from "lodash";
import { error } from "ts-pystyle";
import { Store } from "vuex";
const has = async (id) => await get(id) != null;

//store
const itemStore = createStore("items", "recording");
const itemInfoStore = createStore("infos", "recording");
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
export async function getItemBlob(id) {
    let res = await get(id, itemStore);
    if (res) return res;
    else return null;
}

async function storeItem(info, blob) {
    let id = info.id;
    await set(id, blob, itemStore);
    await set(id, info, itemInfoStore);
    //还应该回滚
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

export default () => ({
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
            if (state.isInited == false) {
                error("错误，还没初始化");
            }
            //只提交info 客户端获取blob应该通过导出的工具函数获取
            state.historyInfos[info.id] = info;
        },
        initHistoryInfo(state, initinfos) {
            // if (state.isInited) console.warn("重复提交初始化更改")
            state.isInited = true;
            state.historyInfos = _.cloneDeep(initinfos);
        },
        removeItem(state, id) {
            if (context.state.isInited == false) {
                error("错误，还没初始化");
            }
            if (id in state.historyInfos) {
                delete state.historyInfos[id];
            }
        },
        updateInfo(state, { id, newInfo }) {
            if (state.isInited == false) {
                error("错误，还没初始化");
            }
            if (id != newInfo.id) error("不能更新Item的id，id不可更改")
            if (id in state.historyInfos) {
                state.historyInfos[id] = newInfo;
            }
        }
    },
    actions: {

        async pushHistory(context, item) {
            //实际添加保存 并提交一个更改到store
            let { info, blob } = item;
            //执行保存并添加更改
            await storeItem(info, blob);
            //更新
            context.commit("addHistoryItem", info);
        },
        async removeHistory(context, id) {
            await removeItem(id);
            context.commit("removeItem", id);
        },
        async renameHistory(context, { id, newName }) {
            if (context.state.isInited == false) {
                error("错误，还没初始化");
            }
            let oldinfo = context.state.historyInfos[id];
            oldinfo.name = newName;
            context.commit("updateInfo", { id, newInfo: oldinfo });
        },
        async clearHistory(context) {
            await clearStores();
            context.commit("initHistoryInfo", {});
        },
        /**
         * 使用历史记录之前必须先调用此函数
         */
        async ensureInitHistory(context) {
            if (context.state.isInited) return;
            let infos = await itemInfos();
            context.commit("initHistoryInfo", infos);
        },

        //工具函数 用于获取一条记录的数据
        async getItem(context, id) {
            if (id in context.state.historyInfos) {
                let info = context.state.historyInfos[id];
                //blob
                let blob = getItemBlob(id);
                if (info == null || blob == null) {
                    console.error("获取记录时出现错误，存在空记录");
                    return null;
                }
                return { info, blob }
            }
            else return null;
        }


    }
})