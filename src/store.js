import { Store } from "vuex";
import recorder from "./stores/recorder"
import history from "./stores/history"
import player from "./stores/player"
export default ()=>new Store({
    modules:{
        recorder:{namespaced:true,...recorder()},
        history:{namespaced:true,...history()},
        player:{namespaced:true,...player()},
    }
})