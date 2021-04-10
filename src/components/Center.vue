<template>
    <div>
        <!-- {{count}} -->
        {{countA}}
        {{hello}}
        <el-button type="primary" @click="test">+1</el-button>
        <div>
            {{countAdd}}
        </div>
    </div>
</template>

<script>
//个人中心
//里面有曾经录过的所有声音
//列表 选择item进入查看信息，编辑，使用工具包进行在线处理（去空白等），云存储（需要登录）
//查看详细笔记等
//考虑player做成独立组件，做成挂件按钮点击显示，在全局显示（App.vue)中，进而切换页面而不中断
//对item的”打开“操作进入独立页面（studio），而点击播放则进入播放器页面（对话框）
//关于自动云端流存储的实现（考虑使用基于websocket或socket.io的上传流）
//关于身份验证和授权的实现 联合登录的实现
import Component from "vue-class-component"
import Vue from "vue"
import { mapState } from "vuex";

@Component({
    computed:{...mapState(["countA"]),hello(){
        return this.countAdd+this.$store.state.countA;
    }}
})
class Player extends Vue{
    count=0;
    get countAdd(){
        return this.count+1;
    }
    test(){
        this.count++;
        this.$store.commit("increment")
    }
    mounted(){
        alert("hello")
    }
}
export default Player;
</script>

<style lang="scss" scoped>

</style>