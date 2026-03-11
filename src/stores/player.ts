import _ from "lodash";

export default () => ({
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
            state.nowPlayInfo = info;
        }
    },
    getters:{
        historyIdxs(state){
            return state.nowPlayInfo ? _.keys({ current: state.nowPlayInfo }) : [];
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