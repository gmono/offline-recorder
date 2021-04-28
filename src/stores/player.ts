import _ from "lodash";
import { Store } from "vuex";

export default ()=>new Store({
    state:{
        //name->info
        //格式就是录音的info格式
        //state:"stopped"|"normal"|"paused"|"playing"
        //其中stopped是一种由info但没有在播放的状态 
        nowPlayInfo:null,
        playState:"stopped"
    },
    mutations:{
        setNowPlay(state,info){
            this.nowPlayInfo=info;
        }
    },
    getters:{
        historyIdxs(state){
            return _.keys(state.historyInfos)
        }
    },
    actions:{
        async init(context,name){

        },
        async play(context,name){
            //播放一个音乐 检测是否存在+从name获取信息和blob，播放
        },
        async pause(context,name){

        },
        async stop(context,name){

        }
    }
})