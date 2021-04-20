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
/**
 * 顶栏 侧边栏 右侧content 经典布局 
 * 侧边栏：
 *      用户信息（带有部分统计信息，其他信息有的话主要是社交信息，内部有重置密码等功能）
 *      统计信息（仪表盘，有历史记录，统计信息，时长记录，有效时长记录（人声））
 *      资源列表（分为本地资源和云端资源，是自己所有录制过的录音的列表，这里可以点击+ 按钮来开启一个录音界面）
 * 录音机页面（录音机）
 * 编辑器野蛮（工作台）
 * 播放器页面（播放器）
 * 
 * 挂件：
 * 录音挂件（与recorder连接同步）
 * 播放器挂件（与player连接同步）
 * 
 * 同时只能启动一个录音，在录音机页面打开时，录音挂件自动隐藏
 *  
 * 挂件在App组件中挂载 在最顶层
 *      
 */
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