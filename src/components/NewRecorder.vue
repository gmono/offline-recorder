<template>
    <div>
        <ul>
            <li v-for=" item in historyIdxs" :key="item">{{item}}</li>
        </ul>
        {{recordingLength}}
        <el-button @click="startNew">开始</el-button>
        <el-button @click="resume">继续</el-button>
        <el-button @click="pause">暂停</el-button>
        <el-button @click="saveRecording">开始</el-button>
    </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
    export default {
        data(){
            return {}
        },
        computed:{
            ...mapGetters("recorder",["recordingLength"]),
            ...mapGetters("history",["historyIdxs"])
        },
        methods:{
            ...mapActions("recorder",["startNew","pause","saveRecording","resume"])
        }
    }
</script>

<style lang="scss" scoped>

</style>