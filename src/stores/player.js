import _ from "lodash";
import { Store } from "vuex";

export default ()=>new Store({
    state:{
        //name->info
        historyInfos:{}
    },
    getters:{
        historyIdxs(state){
            return _.keys(state.historyInfos)
        }
    }
})