<template>
    <div>
        {{recordingLength}}
        <el-button @click="startNew">开始</el-button>
    </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
    export default {
        data(){
            return {}
        },
        computed:{
            ...mapGetters(["recordingLength"])
        },
        methods:{
            ...mapActions(["startNew","pause","saveRecording"])
        }
    }
</script>

<style lang="scss" scoped>

</style>