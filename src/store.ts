import { Store } from "vuex";
import recorder from "./stores/recorder"
import history from "./stores/history"
import player from "./stores/player"
import tempcache from "./stores/tempcache"
export default ()=>new Store({
    modules:{
        recorder:{namespaced:true,...recorder()},
        history:{namespaced:true,...history()},
        tempcache:{namespaced:true,...tempcache()},
        // player:{namespaced:true,...player()},
    }
})