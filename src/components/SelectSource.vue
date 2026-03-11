<template>
  <label class="block text-sm text-slate-600">
    <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">媒体源</span>
    <select
      v-model="selected"
      class="w-full rounded-2xl border border-white/55 bg-white/72 px-4 py-3 outline-none transition focus:border-[#6C5CE7] focus:ring-4 focus:ring-[#6C5CE7]/12"
      @change="emitSelect"
    >
      <option v-for="item in medianames" :key="item.value" :value="item.value">
        {{ item.name }}
      </option>
    </select>
    <span v-if="showHelp" class="mt-2 block text-xs leading-5 text-slate-400">麦克风适合纯音频，摄像头与录屏会保存为视频，内部音源会尝试只保留系统声音。</span>
  </label>
</template>

<script>
import { error } from 'ts-pystyle'

export async function getMediaStream(name) {
  const handlers = {
    async mic() {
      return navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })
    },
    async capture() {
      return navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
    },
    async screen() {
      return navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      })
    },
    async audiooutput() {
      const raw = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      })
      return new MediaStream(raw.getAudioTracks())
    },
  }

  if (!(name in handlers)) {
    return null
  }

  try {
    return await handlers[name]()
  } catch (err) {
    error('此媒体源不可用，请切换媒体源')
    return null
  }
}

const typeMap = {
  mic: 'audio',
  capture: 'video',
  screen: 'video',
  audiooutput: 'audio',
}

export async function getMedia(name) {
  const stream = await getMediaStream(name)
  if (!stream) {
    return null
  }

  return {
    stream,
    name,
    type: typeMap[name],
  }
}

export default {
  name: 'SelectSource',
  props: {
    value: {
      type: String,
      default: 'mic',
    },
    showHelp: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      selected: this.value || 'mic',
      medianames: [
        { name: '麦克风（音频）', value: 'mic' },
        { name: '摄像头（视频 + 音频）', value: 'capture' },
        { name: '录屏（视频 + 电脑内音频）', value: 'screen' },
        { name: '内部音源（电脑内音频）', value: 'audiooutput' },
      ],
    }
  },
  watch: {
    value(next) {
      this.selected = next || 'mic'
    },
  },
  methods: {
    emitSelect() {
      this.$emit('update:value', this.selected)
      this.$emit('select', this.selected)
    },
  },
}
</script>
