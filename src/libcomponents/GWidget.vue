<template>
  <div
    style="background: green"
    ref="cont"
    class="container"
    :style="{ left: x + 'px', top: y + 'px' }"
    @mouseover="enter($event)"
    @mouseout="leave($event)"
    @mousedown="down($event)"
  >
    <slot></slot>
  </div>
</template>

<script>
/**
 * 内容 每个节点都可以有dragable=true属性 这样容器会自动处理拖动
 */
export default {
  data() {
    return {
      x: 0,
      y: 0,
      beforeDrag: false,
      draging: false,
      dragX: 0,
      dragY: 0,
    };
  },
  mounted() {
    document.addEventListener("mousemove", (e) => this.move(e));
    document.addEventListener("mouseup", (e) => this.up(e));
  },
  methods: {
    isdrag(e) {
      // debugger;
      // console.log(e.target);
      let drag = e.target.dataset["draggable"];
      if (drag) {
        // console.log(e);
        return true;
      }
      return false;
    },
    enter(e) {
      if (this.draging) return;
      if (this.isdrag(e)) {
        this.beforeDrag = true;
        this.draging = false;
      }
    },
    leave(e) {
      if (this.draging) return;
      if (this.isdrag(e)) {
        this.beforeDrag = false;
        this.draging = false;
      }
    },
    /**
     * @param {MouseEvent} e
     */
    move(e) {
      if (this.draging) {
        //此方法简单顺滑 但不兼容IE
        // this.x+=e.movementX;
        // this.y+=e.movementY;
        this.x = e.clientX - this.dragX;
        this.y = e.clientY - this.dragY;
        console.log(this.dragX, this.dragY);
      }
    },
    down(e) {
      if (e.currentTarget == this.$refs["cont"]) {
        //layer系列支持ie9 如果这里不是用的fixed而是abs定位 计算还要复杂
        //最终位置需要加上 （页面左上角-窗口左上角）的向量
        let rect = e.currentTarget.getBoundingClientRect();
        this.dragX = e.clientX - rect.left;
        this.dragY = e.clientY - rect.top;
        console.log(this.dragX, this.dragY);
      }
      if (this.isdrag(e) && this.beforeDrag) {
        this.beforeDrag = false;
        this.draging = true;
      }
    },
    up(e) {
      //文档里释放鼠标都算
      if (this.draging) {
        this.beforeDrag = true;
        this.draging = false;
        //这里调用靠边函数
      }
      this.effect();
    },
    effect() {
      //靠边
      if(this.x<0) this.x=0;
      if (Math.abs(this.x) < 20) {
        this.x = 0;
      }
      if (Math.abs(this.y) < 20) {
        this.x = 0;
      }
    },
  },
};
</script>

<style scoped>
.container {
  position: fixed;
}
</style>