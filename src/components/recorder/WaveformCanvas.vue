<template>
  <div
    class="waveform-canvas-wrapper"
    :style="{ height: height + 'px' }"
  >
    <canvas
      ref="canvas"
      class="waveform-canvas"
    />
  </div>
</template>

<script>
/**
 * WaveformCanvas — 实时音频波形可视化组件
 *
 * 使用 AnalyserNode 获取时域数据，在 Canvas 上绘制渐变波形。
 * 录制时显示动态波形，非录制状态显示静态待命动画。
 *
 * @prop {Boolean} active - 是否正在录制（控制实时波形 vs 静态动画）
 * @prop {AnalyserNode|null} analyserNode - Web Audio API 分析器节点
 * @prop {Number} height - 画布高度 (px)
 */
export default {
  name: 'WaveformCanvas',
  props: {
    active: {
      type: Boolean,
      default: false,
    },
    analyserNode: {
      type: Object,
      default: null,
    },
    height: {
      type: Number,
      default: 180,
    },
  },
  data() {
    return {
      animFrameId: null,
      idlePhase: 0,
    }
  },
  watch: {
    active(val) {
      if (val && this.analyserNode) {
        this.startDraw()
      }
    },
    analyserNode(val) {
      if (val && this.active) {
        this.startDraw()
      }
    },
  },
  mounted() {
    this.resizeCanvas()
    window.addEventListener('resize', this.resizeCanvas)
    this.startDraw()
  },
  beforeDestroy() {
    this.stopDraw()
    window.removeEventListener('resize', this.resizeCanvas)
  },
  methods: {
    resizeCanvas() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      const wrapper = canvas.parentElement
      if (!wrapper) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = wrapper.clientWidth * dpr
      canvas.height = this.height * dpr
      canvas.style.width = wrapper.clientWidth + 'px'
      canvas.style.height = this.height + 'px'
    },
    startDraw() {
      if (this.animFrameId) return
      const loop = () => {
        this.draw()
        this.animFrameId = requestAnimationFrame(loop)
      }
      loop()
    },
    stopDraw() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId)
        this.animFrameId = null
      }
    },
    draw() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height
      const dpr = window.devicePixelRatio || 1

      // 清除画布
      ctx.clearRect(0, 0, w, h)

      // 背景渐变
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
      bgGrad.addColorStop(0, 'rgba(108, 92, 231, 0.08)')
      bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.08)')
      ctx.fillStyle = bgGrad
      ctx.beginPath()
      const radius = 18 * dpr
      this.roundRect(ctx, 0, 0, w, h, radius)
      ctx.fill()

      if (this.active && this.analyserNode) {
        this.drawLiveWaveform(ctx, w, h, dpr)
      } else {
        this.drawIdleWaveform(ctx, w, h, dpr)
      }
    },
    drawLiveWaveform(ctx, w, h, dpr) {
      const analyser = this.analyserNode
      const bufLen = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufLen)
      analyser.getByteTimeDomainData(dataArray)

      // 波形线渐变
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, '#6C5CE7')
      grad.addColorStop(1, '#FF6B9D')

      ctx.lineWidth = 2.5 * dpr
      ctx.strokeStyle = grad
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      // 柱状波形 (bars style)
      const barCount = 64
      const gap = 3 * dpr
      const barWidth = (w - gap * (barCount - 1)) / barCount
      const samplesPerBar = Math.floor(bufLen / barCount)

      ctx.fillStyle = grad

      for (let i = 0; i < barCount; i++) {
        // 取这个 bar 对应区段的最大振幅
        let maxVal = 0
        const startSample = i * samplesPerBar
        for (let j = 0; j < samplesPerBar; j++) {
          const v = Math.abs((dataArray[startSample + j] || 128) - 128)
          if (v > maxVal) maxVal = v
        }

        // 归一化到 0-1
        const normalized = maxVal / 128
        const minH = 4 * dpr
        const maxH = (h - 24 * dpr) * 0.9
        const barH = minH + normalized * maxH

        const x = i * (barWidth + gap)
        const y = (h - barH) / 2
        const barRadius = barWidth / 2

        ctx.beginPath()
        this.roundRect(ctx, x, y, barWidth, barH, barRadius)
        ctx.fill()
      }
    },
    drawIdleWaveform(ctx, w, h, dpr) {
      this.idlePhase += 0.05
      const barCount = 36
      const gap = 4 * dpr
      const totalGap = gap * (barCount - 1)
      const barWidth = Math.max(4 * dpr, (w - totalGap) / barCount)

      // 渐变
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, 'rgba(108, 92, 231, 0.4)')
      grad.addColorStop(1, 'rgba(255, 107, 157, 0.4)')
      ctx.fillStyle = grad

      for (let i = 0; i < barCount; i++) {
        const progress = barCount <= 1 ? 0 : i / (barCount - 1)
        const centerBias = 1 - Math.abs(progress * 2 - 1)
        const pulse = (Math.sin(this.idlePhase * 2.2 - progress * 6.4) + 1) / 2
        const shimmer = (Math.cos(this.idlePhase * 1.4 + progress * 9) + 1) / 2
        const minH = 6 * dpr
        const maxH = (h - 24 * dpr) * 0.56
        const energy = Math.min(1, 0.12 + centerBias * 0.55 + pulse * 0.22 + shimmer * 0.11)
        const barH = minH + energy * maxH

        const x = i * (barWidth + gap)
        const y = (h - barH) / 2
        const barRadius = barWidth / 2

        ctx.beginPath()
        this.roundRect(ctx, x, y, barWidth, barH, barRadius)
        ctx.fill()
      }
    },
    roundRect(ctx, x, y, w, h, r) {
      if (w < 2 * r) r = w / 2
      if (h < 2 * r) r = h / 2
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
    },
  },
}
</script>

<style scoped>
.waveform-canvas-wrapper {
  width: 100%;
  overflow: hidden;
}
.waveform-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
