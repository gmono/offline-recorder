<template>
  <div class="queue-inspector">
    <!-- Header with tabs -->
    <div class="qi-header">
      <div class="qi-titlebar">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="2" width="14" height="3" rx="1" fill="#0078d4"/>
          <rect x="1" y="7" width="14" height="3" rx="1" fill="#50a0e0"/>
          <rect x="1" y="12" width="14" height="3" rx="1" fill="#a0c8f0"/>
        </svg>
        <span class="qi-title">队列监视器</span>
      </div>
      <div class="qi-tabs">
        <button
          v-for="q in queueList"
          :key="q.id"
          class="qi-tab"
          :class="{ active: activeQueueId === q.id }"
          @click="selectQueue(q.id)"
        >
          <span class="qi-tab-dot" :class="q.active ? 'dot-active' : 'dot-idle'"></span>
          {{ q.label }}
          <span v-if="q.active" class="qi-tab-badge">使用中</span>
        </button>
      </div>
    </div>

    <!-- Provider info banner -->
    <div class="qi-provider-info">
      <div class="qi-info-row">
        <span class="qi-info-label">当前提供者</span>
        <span class="qi-info-value">{{ providerName }}</span>
      </div>
      <div class="qi-info-row">
        <span class="qi-info-label">模式</span>
        <span class="qi-info-value qi-kind-badge" :class="'kind-' + providerKind">{{ kindLabel }}</span>
      </div>
      <div class="qi-info-row">
        <span class="qi-info-label">状态</span>
        <span class="qi-info-value">
          <span class="qi-status-dot" :class="providerReady ? 'dot-ok' : 'dot-err'"></span>
          {{ providerReady ? '已就绪' : '未就绪' }}
        </span>
      </div>
      <div class="qi-info-row">
        <span class="qi-info-label">能力</span>
        <span class="qi-info-value qi-caps">
          <span v-if="capabilities.streaming" class="cap-tag cap-stream">流式写入</span>
          <span v-if="capabilities.directURL" class="cap-tag cap-url">直接URL</span>
          <span v-if="capabilities.persistent" class="cap-tag cap-persist">持久存储</span>
          <span v-if="capabilities.requiresPermission" class="cap-tag cap-perm">需授权</span>
          <span v-if="!capabilities.streaming && !capabilities.directURL && !capabilities.persistent" class="cap-tag cap-none">基础</span>
        </span>
      </div>
    </div>

    <!-- Queue stats -->
    <div class="qi-stats">
      <div class="qi-stat-card">
        <div class="stat-number">{{ chunkCount }}</div>
        <div class="stat-label">Chunk 数</div>
      </div>
      <div class="qi-stat-card">
        <div class="stat-number">{{ totalSizeLabel }}</div>
        <div class="stat-label">总大小</div>
      </div>
      <div class="qi-stat-card">
        <div class="stat-number">{{ avgChunkLabel }}</div>
        <div class="stat-label">平均 Chunk</div>
      </div>
    </div>

    <!-- Chunk list -->
    <div class="qi-chunk-area">
      <div class="qi-chunk-header">
        <span class="qi-chunk-title">Chunk 列表</span>
        <button class="qi-refresh-btn" @click="$emit('refresh')" title="刷新">
          <svg width="12" height="12" viewBox="0 0 16 16"><path d="M13.5 8a5.5 5.5 0 11-1.3-3.56" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M13 1.5v3.5H9.5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
          刷新
        </button>
      </div>

      <div v-if="loadingChunks" class="qi-loading">
        <div class="loading-spinner-sm"></div>
        正在读取队列…
      </div>

      <div v-else-if="!chunks.length" class="qi-empty">
        队列为空
      </div>

      <div v-else class="qi-chunk-list">
        <div
          v-for="(chunk, idx) in chunks"
          :key="idx"
          class="qi-chunk-row"
        >
          <span class="chunk-index">#{{ idx }}</span>
          <div class="chunk-bar-wrap">
            <div
              class="chunk-bar"
              :style="{ width: barWidth(chunk.size) + '%' }"
            ></div>
          </div>
          <span class="chunk-size">{{ formatSize(chunk.size) }}</span>
          <span v-if="chunk.type" class="chunk-type">{{ chunk.type }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import filesize from 'filesize'

export default {
  name: 'QueueInspector',
  props: {
    /** 可用队列列表: [{ id, label, active }] */
    queueList: {
      type: Array,
      default: function () { return [] },
    },
    /** 当前选中的队列 ID */
    activeQueueId: {
      type: String,
      default: '',
    },
    /** Provider 名称 */
    providerName: {
      type: String,
      default: '未知',
    },
    /** Provider kind */
    providerKind: {
      type: String,
      default: '',
    },
    /** Provider 是否就绪 */
    providerReady: {
      type: Boolean,
      default: false,
    },
    /** Provider 能力 */
    capabilities: {
      type: Object,
      default: function () { return {} },
    },
    /** chunk 总数 */
    chunkCount: {
      type: Number,
      default: 0,
    },
    /** 总大小 (bytes) */
    totalSize: {
      type: Number,
      default: 0,
    },
    /** chunk 详情列表: [{ size, type }] */
    chunks: {
      type: Array,
      default: function () { return [] },
    },
    /** 是否正在加载 */
    loadingChunks: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    totalSizeLabel: function () {
      return this.totalSize > 0 ? filesize(this.totalSize) : '0'
    },
    avgChunkLabel: function () {
      if (this.chunkCount === 0) return '—'
      return filesize(Math.round(this.totalSize / this.chunkCount))
    },
    maxChunkSize: function () {
      if (!this.chunks.length) return 1
      var max = 0
      for (var i = 0; i < this.chunks.length; i++) {
        if (this.chunks[i].size > max) max = this.chunks[i].size
      }
      return max || 1
    },
    kindLabel: function () {
      var map = {
        queue: '队列',
        file: '文件',
        hybrid: '混合',
      }
      return map[this.providerKind] || this.providerKind || '—'
    },
  },
  methods: {
    formatSize: function (bytes) {
      return bytes > 0 ? filesize(bytes) : '0'
    },
    barWidth: function (size) {
      return Math.max(2, Math.round((size / this.maxChunkSize) * 100))
    },
    selectQueue: function (id) {
      this.$emit('select-queue', id)
    },
  },
}
</script>

<style scoped>
.queue-inspector {
  border: 1px solid #ccd1d9;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
  font-size: 13px;
  color: #1b1b1b;
}

/* ---- Header ---- */
.qi-header {
  background: linear-gradient(180deg, #f6f7f9 0%, #eef0f4 100%);
  border-bottom: 1px solid #d6d9de;
}
.qi-titlebar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}
.qi-tabs {
  display: flex;
  gap: 0;
  padding: 6px 8px 0;
}
.qi-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  background: transparent;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  transition: background 0.12s;
  user-select: none;
  position: relative;
  bottom: -1px;
}
.qi-tab:hover {
  background: #e5e8ee;
}
.qi-tab.active {
  background: #fff;
  border-color: #d6d9de;
  color: #0053a6;
  font-weight: 600;
}
.qi-tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.dot-active {
  background: #107c10;
}
.dot-idle {
  background: #bbb;
}
.qi-tab-badge {
  font-size: 9px;
  background: #e1f3d8;
  color: #107c10;
  border-radius: 3px;
  padding: 1px 5px;
  font-weight: 600;
}

/* ---- Provider info ---- */
.qi-provider-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0;
  padding: 10px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e2e4ea;
}
.qi-info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  font-size: 12px;
}
.qi-info-label {
  color: #888;
  white-space: nowrap;
}
.qi-info-value {
  color: #333;
  font-weight: 500;
}
.qi-kind-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 3px;
  font-weight: 600;
}
.kind-queue { background: #e6f0ff; color: #0053a6; }
.kind-file { background: #fff4e6; color: #9a6700; }
.kind-hybrid { background: #e6ffe6; color: #107c10; }
.qi-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}
.dot-ok { background: #107c10; }
.dot-err { background: #d83b01; }
.qi-caps {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.cap-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 500;
}
.cap-stream { background: #e6f0ff; color: #0053a6; }
.cap-url { background: #fff4e6; color: #9a6700; }
.cap-persist { background: #e6ffe6; color: #107c10; }
.cap-perm { background: #fde; color: #d83b01; }
.cap-none { background: #f0f0f0; color: #888; }

/* ---- Stats ---- */
.qi-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: #e2e4ea;
  border-bottom: 1px solid #e2e4ea;
}
.qi-stat-card {
  background: #fff;
  padding: 12px 16px;
  text-align: center;
}
.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #0053a6;
}
.stat-label {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

/* ---- Chunk area ---- */
.qi-chunk-area {
  padding: 8px 12px 12px;
}
.qi-chunk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.qi-chunk-title {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}
.qi-refresh-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #d6d9de;
  background: #f7f8fa;
  border-radius: 4px;
  padding: 3px 10px;
  font-size: 11px;
  color: #555;
  cursor: pointer;
  transition: background 0.12s;
}
.qi-refresh-btn:hover {
  background: #e5e8ee;
}

.qi-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #888;
  font-size: 12px;
  padding: 16px;
  justify-content: center;
}
.loading-spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid #e2e4ea;
  border-top-color: #0078d4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.qi-empty {
  text-align: center;
  color: #bbb;
  font-size: 12px;
  padding: 24px;
}

.qi-chunk-list {
  max-height: 220px;
  overflow-y: auto;
}
.qi-chunk-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  font-size: 12px;
}
.chunk-index {
  width: 32px;
  color: #888;
  text-align: right;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.chunk-bar-wrap {
  flex: 1;
  height: 10px;
  background: #f0f2f5;
  border-radius: 2px;
  overflow: hidden;
}
.chunk-bar {
  height: 100%;
  background: linear-gradient(90deg, #0078d4, #50a0e0);
  border-radius: 2px;
  transition: width 0.3s;
}
.chunk-size {
  width: 60px;
  text-align: right;
  color: #555;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.chunk-type {
  font-size: 10px;
  color: #888;
  flex-shrink: 0;
}
</style>
