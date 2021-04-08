//自动存储插件

import Vue from "vue"

/**
 * @type {Vue}
 */
export default {
    /**
     * 
     * @param {import("vue/types/vue").VueConstructor<Vue>} Vue 
     * @param {*} options 
     */
    install(Vue,options){
        //storage 响应式方法
        Vue.prototype.storageData=()=>{
            return {};
        }

        Vue.mixin({
            created(){
                //创建组件时
                //在数据混入后，监听storageData中的数据更改
                let obj=this.storageData();
                for(let k in obj){
                    let v=obj[k];
                    if(typeof v!=)
                }
            },
            /**
             * 调用storageData 并混入
             */
            data(){
                if(this.storageData!=null){
                    return this.storageData();
                }
            }
        //监听storage中的数据的更改 并同步到Vue实例上 并进行更新
    }
}