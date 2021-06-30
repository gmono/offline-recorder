<template>
  <div>
    <template v-if="data.type == 'point'">
      <template v-if="'title' in data.note">
        <template
          v-if="
            data.note.title == data.note.desc &&
            data.note.desc == data.note.content
          "
        >
          <!-- 记录点 -->
          <div>记录点:{{ data.note.title }}</div>
        </template>
        <template v-else>
          <el-collapse>
            <el-collapse-item name="笔记信息" title="笔记信息">
              <el-form>
                <el-form-item label="标题">
                  <el-input
                    :value="data.note.title"
                    :disabled="true"
                    placeholder=""
                  ></el-input>
                </el-form-item>
                <el-form-item label="简述">
                  <el-input
                    :value="data.note.desc"
                    :disabled="true"
                    placeholder=""
                  ></el-input>
                </el-form-item>
              </el-form>
            </el-collapse-item>
          </el-collapse>

          <mavon-editor
            style="width: 100%"
            :style="{ height: '60vh' }"
            v-model="data.note.content"
            :subfield="false"
            defaultOpen="preview"
            :editable="false"
            :toolbars="{}"
          ></mavon-editor>
        </template>
        <!-- 笔记 -->
      </template>
      <template v-else>
        <!-- 标记点 -->
        <div>标记点:{{ data.time }}</div>
      </template>
    </template>
    <template v-else-if="data.type == 'pause'"> </template>
  </div>
</template>

<script>
export default {
  //显示笔记 如果是标记点 显示标记点 时间  笔记 显示笔记 不允许编辑
  props: {
    data: {
      type: Object,
      default: {},
    },
  },
};
</script>

<style lang="scss" scoped>
</style>