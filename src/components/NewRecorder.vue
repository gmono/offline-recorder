<template>
    <div>
        <ul>
            <li v-for=" (item,k) in historyInfos" :key="k">{{JSON.stringify(item)}}</li>
        </ul>
        {{recordingLength}}
        <el-button @click="startNew">开始</el-button>
        <el-button @click="resume">继续</el-button>
        <el-button @click="pause">暂停</el-button>
        <el-button @click="saveRecording()">开始</el-button>
    </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
    export default {
        data(){
            return {}
        },
        async mounted(){
            await this.ensureInitHistory();
        },
        computed:{
            ...mapGetters("recorder",["recordingLength"]),
            ...mapGetters("history",["historyIdxs"]),
            ...mapState("history",["historyInfos"])
        },
        methods:{
            ...mapActions("recorder",["startNew","pause","saveRecording","resume"]),
            ...mapActions("history",["ensureInitHistory"])
        }
    }
</script>

<style lang="scss" scoped>

</style>