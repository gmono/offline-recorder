<template>
  <div>
    <textarea @keydown="down($event)" @keyup="up($event)"></textarea>
  </div>
</template>

<script>
export default {
  //基于markdown编辑器封装 记录时间序列
  data() {
    return {
      timelist: [],
    };
  },
  watch:{
      timelist(){
          console.log(this.timelist)
      }
  },
  methods: {
    /**
     */
    down(e) {
      this.timelist.push({
        code: e.code,
        type: "down",
      });
    },
    up(e) {
      this.timelist.push({
        code: e.code,
        type: "up",
      });
    },
    get(){
        return this.timelist;
    }
  },
};
</script>

<style lang="scss" scoped>
</style>