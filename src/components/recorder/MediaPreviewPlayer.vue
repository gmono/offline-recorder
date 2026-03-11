<template>
  <div class="space-y-4">
    <div
      class="overflow-hidden rounded-[24px] border border-[#e2e4ea] bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      @click="handleStageClick"
    >
      <audio
        v-if="isAudio"
        ref="media"
        class="media-preview-player__hidden-media"
        :src="src"
        preload="metadata"
        @loadedmetadata="syncFromMedia"
        @durationchange="syncFromMedia"
        @timeupdate="syncFromMedia"
        @play="handlePlay"
        @pause="handlePause"
        @ended="handleEnded"
      />

      <div v-if="isAudio" class="audio-preview-stage">
        <div class="audio-preview-stage__glow"></div>
        <div class="audio-preview-stage__content">
          <div class="audio-preview-stage__badge">{{ isPlaying ? '正在播放' : '音频预览' }}</div>
          <div class="audio-preview-stage__title">{{ titleText }}</div>
          <div class="audio-preview-stage__subtitle">{{ currentTimeText }} / {{ durationText }}</div>
        </div>
        <div class="audio-preview-stage__bars" :class="{ 'is-playing': isPlaying }">
          <span
            v-for="bar in audioBars"
            :key="bar.id"
            :style="bar.style"
          ></span>
        </div>
      </div>

      <video
        v-else
        ref="media"
        :src="src"
        playsinline
        preload="metadata"
        class="block w-full bg-slate-950 object-contain"
        :style="{ maxHeight: viewportHeight + 'px' }"
        @loadedmetadata="syncFromMedia"
        @durationchange="syncFromMedia"
        @timeupdate="syncFromMedia"
        @play="handlePlay"
        @pause="handlePause"
        @ended="handleEnded"
      />
    </div>

    <div class="glass-soft px-4 py-4">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="media-preview-player__action media-preview-player__action--primary"
          :disabled="!src"
          @click.stop="togglePlay"
        >
          {{ isPlaying ? '暂停' : '播放' }}
        </button>

        <div class="min-w-0 flex-1">
          <div class="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
            <span>{{ currentTimeText }}</span>
            <span>{{ durationText }}</span>
          </div>
          <input
            type="range"
            class="media-preview-player__slider"
            min="0"
            :max="effectiveDuration || 0"
            :step="0.01"
            :value="currentTime"
            :disabled="!canSeek"
            @input="seekTo"
            @click.stop
          />
        </div>

        <button
          type="button"
          class="media-preview-player__action"
          :disabled="!src"
          @click.stop="toggleMute"
        >
          {{ isMuted ? '取消静音' : '静音' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
function formatTime(seconds) {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  const hour = Math.floor(total / 3600)
  const minute = Math.floor((total % 3600) / 60)
  const second = total % 60
  if (hour > 0) {
    return [hour, minute, second].map((v) => String(v).padStart(2, '0')).join(':')
  }
  return [minute, second].map((v) => String(v).padStart(2, '0')).join(':')
}

export default {
  name: 'MediaPreviewPlayer',
  props: {
    src: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'audio',
    },
    title: {
      type: String,
      default: '',
    },
    fallbackDuration: {
      type: Number,
      default: 0,
    },
    viewportHeight: {
      type: Number,
      default: 280,
    },
  },
  data() {
    return {
      isPlaying: false,
      isMuted: false,
      currentTime: 0,
      duration: 0,
    }
  },
  computed: {
    isAudio() {
      return this.type !== 'video'
    },
    canSeek() {
      return !!this.src && this.effectiveDuration > 0
    },
    currentTimeText() {
      return formatTime(this.currentTime)
    },
    durationText() {
      return formatTime(this.effectiveDuration)
    },
    titleText() {
      return this.title || (this.isAudio ? '当前音频片段' : '当前视频片段')
    },
    effectiveDuration() {
      return this.duration > 0 ? this.duration : this.fallbackDuration
    },
    audioBars() {
      return Array.from({ length: 18 }, (_, index) => {
        const intensity = 0.35 + Math.sin(index * 0.72) * 0.18 + (index % 3) * 0.08
        return {
          id: index,
          style: {
            height: `${30 + Math.round(intensity * 90)}px`,
            animationDelay: `${index * 0.08}s`,
            opacity: `${0.48 + (index % 5) * 0.09}`,
          },
        }
      })
    },
  },
  watch: {
    src() {
      this.resetState()
      this.$nextTick(() => {
        const media = this.getMediaElement()
        if (!media) return
        media.pause()
        media.currentTime = 0
        media.muted = this.isMuted
        if (typeof media.load === 'function') {
          media.load()
        }
      })
    },
    type() {
      this.resetState()
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.syncFromMedia()
    })
  },
  beforeDestroy() {
    this.pause()
  },
  methods: {
    getMediaElement() {
      return this.$refs.media || null
    },
    resetState() {
      this.isPlaying = false
      this.currentTime = 0
      this.duration = 0
    },
    syncFromMedia() {
      const media = this.getMediaElement()
      if (!media) return
      this.currentTime = Number.isFinite(media.currentTime) ? media.currentTime : 0
      this.duration = Number.isFinite(media.duration) ? media.duration : 0
      this.isMuted = !!media.muted
      this.isPlaying = !media.paused && !media.ended
    },
    async play() {
      const media = this.getMediaElement()
      if (!media) return
      await media.play()
      this.syncFromMedia()
    },
    pause() {
      const media = this.getMediaElement()
      if (!media) return
      media.pause()
      this.syncFromMedia()
    },
    async togglePlay() {
      if (!this.src) return
      if (this.isPlaying) {
        this.pause()
        return
      }
      try {
        await this.play()
      } catch {
        // ignore autoplay rejection
      }
    },
    toggleMute() {
      const media = this.getMediaElement()
      if (!media) return
      media.muted = !media.muted
      this.syncFromMedia()
    },
    seekTo(event) {
      const media = this.getMediaElement()
      if (!media) return
      media.currentTime = Number(event.target.value || 0)
      this.syncFromMedia()
    },
    handlePlay() {
      this.isPlaying = true
    },
    handlePause() {
      this.isPlaying = false
    },
    handleEnded() {
      const media = this.getMediaElement()
      if (media) {
        media.currentTime = 0
      }
      this.syncFromMedia()
    },
    handleStageClick() {
      if (!this.isAudio) {
        this.togglePlay()
      }
    },
  },
}
</script>

<style scoped>
.media-preview-player__hidden-media {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.audio-preview-stage {
  position: relative;
  min-height: 220px;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(108, 92, 231, 0.22), transparent 42%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.9));
}

.audio-preview-stage__glow {
  position: absolute;
  inset: auto -8% -42% auto;
  width: 220px;
  height: 220px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(255, 107, 157, 0.35), transparent 68%);
  filter: blur(12px);
}

.audio-preview-stage__content {
  position: relative;
  z-index: 1;
  padding: 28px 28px 0;
}

.audio-preview-stage__badge {
  display: inline-flex;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.74);
  text-transform: uppercase;
}

.audio-preview-stage__title {
  margin-top: 16px;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.2;
  color: #fff;
  word-break: break-word;
}

.audio-preview-stage__subtitle {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.72);
}

.audio-preview-stage__bars {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 28px;
  padding-top: 24px;
}

.audio-preview-stage__bars span {
  display: block;
  width: 10px;
  border-radius: 9999px;
  background: linear-gradient(180deg, rgba(252, 165, 165, 0.94), rgba(192, 132, 252, 0.84));
  transform-origin: center bottom;
  animation: audio-preview-idle 1.9s ease-in-out infinite;
}

.audio-preview-stage__bars.is-playing span {
  animation-duration: 1s;
}

.media-preview-player__action {
  flex-shrink: 0;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.82);
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  transition: all 0.2s ease;
}

.media-preview-player__action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.media-preview-player__action:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.media-preview-player__action--primary {
  background: linear-gradient(135deg, #6c5ce7, #8b5cf6);
  border-color: transparent;
  color: #fff;
}

.media-preview-player__slider {
  width: 100%;
  appearance: none;
  height: 8px;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgba(108, 92, 231, 0.92), rgba(244, 114, 182, 0.88));
  outline: none;
}

.media-preview-player__slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: #fff;
  border: 3px solid #6c5ce7;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
  cursor: pointer;
}

.media-preview-player__slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: #fff;
  border: 3px solid #6c5ce7;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
  cursor: pointer;
}

.media-preview-player__slider::-moz-range-track {
  height: 8px;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgba(108, 92, 231, 0.92), rgba(244, 114, 182, 0.88));
}

@keyframes audio-preview-idle {
  0%, 100% {
    transform: scaleY(0.48);
  }
  50% {
    transform: scaleY(1.02);
  }
}
</style>
