import { Store } from "vuex";
import {v4} from "uuid"
function newRecordingInfo() {
    return {
        id: `record_${v4()}`,
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
    const point = newCheckPoint();
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
    const point = newCheckPoint();
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
    const point = newCheckPoint();
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
import { onErrorResumeNext, Subject } from "rxjs";


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

export default () => ({
    // namespace:true,
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
        recordingInfo: null


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
        },
        historyBlobs(state) {

        }
    },
    actions: {
        //录音机控制部分
        //启动一个新录制过程
        async newRecorder() {

        },
        async startNew(context) {
            // console.log(state)
            await recorder.ensureinit();
            //开始一个新的 如果有旧的 就保存并清除
            // console.log(this)
            if (context.state.state == "normal") {
                context.commit("switchState", "start");
                //启动录音机 开始监听 pushFrame
                nowSub = recorder.onDataAvailable.subscribe(d => {
                    context.commit("pushBlob", d);
                });
                //开始pushframe
                recorder.recorder.start(1000);
            }
            else {
                //如果是其他状态 直接抛出错误 （如果是停止的话自动保存） 这里暂时抛出错误
                error("还没恢复到未开始状态")
            }
        },
        async resume(context) {
            await recorder.ensureinit();
            if (context.state.state != "paused") {
                error("并非在暂停状态，调用resume");
                return;
            }
            context.commit("switchState", "start")
            recorder.recorder.resume();
        },
        async pause(context) {

            //停止录音并切换到pause
            context.commit("switchState", "pause");
            await recorder.ensureinit();
            recorder.recorder.pause();
        },
        //结束一个录音 并存储录音
        /**
         * 停止并保存录音 
         * @param {string} name
         */
        async saveRecording(context, name) {
            //可设置包保存的名字 不设置采取默认
            //切换状态设置名字并保存
            context.commit("switchState", "stop");
            await recorder.ensureinit();
            recorder.recorder.stop();
            nowSub.unsubscribe();
            nowSub = null;
            //
            //执行保存录音 清空临时缓存 还原状态到normal 三步操作
            if(name!=null)
                context.commit("setRecordingName",name);
            await context.dispatch("storeToDisk");
            //清空临时缓存
            context.dispatch("tempcache/clearCache",null,{root:true})
            //恢复
            context.commit("switchState", "recover")
        },
        //下面是工具函数
        async storeToDisk(context) {
            //保存录音到磁盘 如果没有合并就自动合并
            if (context.state.mergedBlob == null)
                context.commit("mergeBlob");
            //保证已经初始化
            await context.dispatch("history/ensureInitHistory",null,{root:true});
            await context.dispatch("history/pushHistory",  {
                info: context.state.recordingInfo,
                blob: context.state.mergedBlob
            },{root:true});
        },
        //
        async pushFrame(context,blob){
            //使用缓存
            context.commit("pushBlob",blob);
            context.dispatch("tempcache/pushItem",blob,{root:true})
        }

    }
})