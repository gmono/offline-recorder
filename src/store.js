import { Store } from "vuex";
function newRecordingInfo() {
    return {
        id: uniqueId("recording"),
        //name是后设置的根据情况可生成
        name: `record_${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
        startTime: new Date(),
        endTime: new Date(),
        /**
         * @type {ReturnType<newCheckPoint>[]}
         */
        points: []
    };
}

//定义录音信息
/**
 * 得到一个暂停信息对象,用于复制给checkpoint的data
 * @param {'pause'|'pause_resume'} type 
 */
function checkpintPauseInfo(type) {
    //时间 和 类型
    let point = newCheckPoint();
    point.type = "pause";
    point.data = {
        pause_type: type,
        time: new Date()
    }
    return point;
}

/**
 *  不带数据 的 创建一个标记点
 */
function checkpointPointInfo() {
    let point = newCheckPoint();
    point.type = "point";
    point.data = {
        type: "point"
    };
    return point;

}

/**
 * 创建一个note点
 * @param {string} notedatal 
 * @returns oid
 */
function checkpointNoteInfo(notedatal) {
    let point = newCheckPoint();
    point.type = "point";
    point.data = {
        type: "note",
        data: notedatal
    }
    return point;
}
function newCheckPoint() {
    return {
        /**
         * @type {'point'|'pause'}
         */
        type: "point",
        //这是带的数据 ，看具体安排 比如笔记
        data: null
    }
}

import { error, range } from "ts-pystyle"
import { uniqueId } from "lodash";
import dayjs from "dayjs";
import { createStore, del, entries, get, keys, set } from "idb-keyval";
import { Subject } from "rxjs";
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
async function getItemBlob(name) {
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

//temp cache 管理
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


//录音机部分
class Recorder {
    constructor() {

    }
    recorder = null;
    /**
     * @type {Subject<Blob>}
     */
    onDataAvailable = new Subject();
    async ensureinit() {
        if (this.recorder != null) return;
        const media = navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });
        const recorder = new MediaRecorder(await media, {
            bitsPerSecond: 128000,
            audioBitrateMode: "variable",
            mimeType: "audio/webm",
        });
        this.recorder = recorder;
        recorder.addEventListener("dataavailable",
            e => this.onDataAvailable.next(e.data));
    }
}


const recorder = new Recorder();

//订阅 recorder
/**
 * @type {Subject}
 */
let nowSub = null;

export default () => new Store({
    state: {
        mergedBlob: null,
        blobs: [],
        //
        /**
         * @type {"recording"|"normal"|"stopped"|"paused"} 
         */
        state: "normal",
        //normal时这个值应该是null
        /**
         * @type {ReturnType<typeof newRecordingInfo>}
         */
        recordingInfo: null,


    },
    mutations: {
        /**
         * 合并blobs并设置mergeBlobs
         */
        mergeBlob(state) {
            //把blobs合并为mergedBlob 并清空blobs
            state.mergedBlob = new Blob(state.blobs);
            state.blobs = [];
        },
        /**
         * 添加一个frame 
         * @param {*} state 
         * @param {Blob} blob 
         */
        pushBlob(state, blob) {
            console.log("receive")
            if (state.state == 'recording')
                state.blobs.push(blob);
            //否则直接丢弃
            else console.error("状态错误，丢弃1帧")
        },
        //point是newCheckPoint的返回值
        addCheckPoint(state, point) {
            if (state.recordingInfo == null) throw new Error("录制信息不存在，可能还没开始录音")
            //添加新checkpoint
            state.recordingInfo.points.push(point);
        },
        setRecordingName(state, name) {
            state.recordingInfo.name = name;
        },
        /**
         * 切换状态 stop只代表状态切换 且不再接受新frame 确定recordinginfo且不再变动
         * 数据并没有保存 recover是恢复状态到normal 这时候数据等操作应该已经完成
         * @param {'start'|'pause'|'stop'|'recover'} action
         */
        switchState(state, action) {
            switch (state.state) {
                //类似这种
                //normal->recrding->pause->start->pause->stop->normal
                case "normal":
                    if (action == "start") {
                        state.state = "recording";
                        state.recordingInfo = newRecordingInfo();
                    } else error("state和action不匹配");
                    break;
                case "recording":
                    if (action == "pause") {
                        state.state = "paused";
                        //暂停后添加pause checkpoint等
                        const t = checkpintPauseInfo("pause");
                        state.recordingInfo.points.push(t);
                    } else if (action == "stop") {
                        state.state = "stopped";
                        //只是停止 还没有保存
                        //停止后不接收frame 并停止更新recordingInfo中的时间等信息 拒绝接收point
                    } else error("state和action不匹配");
                    break;
                case "paused":
                    if (action == "stop") {
                        //暂停到停止和recording到停止一样
                        state.state = "stopped";
                    }
                    else if (action == "start") {
                        //resume操作
                        state.state = "recording";
                        state.recordingInfo.points.push(checkpintPauseInfo("pause_resume"))
                    } else error("state和action不匹配");
                    break;
                case "stopped":
                    //停止状态只接收recover信号
                    if (action == "recover") {
                        //恢复 表示之前的工作已经做完
                        state.state = "normal";
                        //清理 recordinginfo和数据
                        state.blobs = [];
                        state.recordingInfo = null;
                        state.mergedBlob = null;
                    } else error("state和action不匹配");
                    break;
            }
        },

    },
    getters: {
        /**
         * 如果没有开始录音返回null
         * @param {*} state 
         * @returns null|number
         */
        recordingLength(state) {
            //
            if (state.recordingInfo == null) return null;
            return state.blobs.length;
        }
    },
    actions: {
        //录音机控制部分
        //启动一个新录制过程
        async newRecorder() {

        },
        async startNew() {
            await recorder.ensureinit();
            //开始一个新的 如果有旧的 就保存并清除
            if (this.state.state == "normal") {
                this.commit("switchState", "start");
                //启动录音机 开始监听 pushFrame
                nowSub = recorder.onDataAvailable.subscribe(d => {
                    this.commit("pushBlob", d);
                });
                //开始pushframe
                recorder.recorder.start(1000);
            }
            else {
                //如果是其他状态 直接抛出错误 （如果是停止的话自动保存） 这里暂时抛出错误
                error("还没恢复到未开始状态")
            }
        },
        async pause() {
            //停止录音并切换到pause
            this.commit("switchState", "pause");
            await recorder.ensureinit();
            recorder.recorder.pause();
        },
        //结束一个录音 并存储录音
        /**
         * 停止并保存录音 
         * @param {string} name
         */
        async saveRecording(state, name) {
            //可设置包保存的名字 不设置采取默认
            //切换状态设置名字并保存
            this.commit("switchState", "stop");
            await recorder.ensureinit();
            recorder.recorder.stop();
            nowSub.unsubscribe();
            //
            //执行保存录音 清空临时缓存 还原状态到normal 三步操作
            this.commit("setRecordingName");
            await this.dispatch("storeToDisk");
            //清空临时缓存
            //恢复
            this.commit("switchState", "recover")
        },

        //下面是工具函数
        async storeToDisk() {
            //保存录音到磁盘 如果没有合并就自动合并
            if (this.state.mergedBlob == null)
                this.commit("mergeBlob");
            await storeItem(this.state.recordingInfo, this.state.mergedBlob);
        },
        //

    }
})