<template>
    <div>
        <template v-if="data.type=='point'">
            <template v-if="'title' in data.note">
                <template v-if="data.note.title==data.note.desc&&data.note.desc==data.note.content">
                    <!-- 记录点 -->
                    <div>记录点:{{data.note.title}}</div>
                </template>
                <template v-else>
                    <div>{{data.note.title}}</div>
                    <div>{{data.note.desc}}</div>
                    <div>{{data.note.content}}</div>

                </template>
                <!-- 笔记 -->
            </template>
            <template v-else>
                <!-- 标记点 -->
                <div>标记点:{{data.time}}</div>
            </template>
        </template>
        <template v-else-if="data.type=='pause'">

        </template>
    </div>
</template>

<script>
    export default {
        //显示笔记 如果是标记点 显示标记点 时间  笔记 显示笔记 不允许编辑
        props:{
            data:{
                type:Object,
                default:{}
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>