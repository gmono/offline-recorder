<template>
  <div>
      <audio v-if="type=='audio'" :src="src" controls></audio>
      <video v-if="type=='video'" :src="src" controls></video>
  </div>
</template>

<script>
export default {
  props: {
    src: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "audio",
    },
    playstate:{
        type:String,
        default:"stopped"
    }
  },
  data() {
    return {
        realState:"stopped"
    };
  },
  watch:{
      playstate(){
          if(this.realState==this.playstate){
              return
          }
          switch(this.playstate){
              case "stopped":
                  break
          }
      }
  },
  mounted(){
      
  }
};
</script>

<style lang="scss" scoped>
</style>