<template>
  <div class="storage-explorer">
    <div class="explorer-titlebar">
      <div class="titlebar-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M1 3.5C1 2.67 1.67 2 2.5 2h4.29a1.5 1.5 0 011.06.44l.7.7a.5.5 0 00.36.15H13.5c.83 0 1.5.67 1.5 1.5V12.5c0 .83-.67 1.5-1.5 1.5h-11A1.5 1.5 0 011 12.5V3.5z" fill="#ffb900"/>
          <path d="M1.5 5h13c.28 0 .5.22.5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5V5.5c0-.28.22-.5.5-.5z" fill="#ffd75e"/>
        </svg>
      </div>
      <span class="titlebar-text">文件管理器</span>
      <span class="titlebar-subtext">文件系统提供者 / 队列提供者 前端</span>
      <div class="titlebar-badge">
        <span class="badge-dot" :class="providerReady ? 'dot-ok' : 'dot-err'"></span>
        <span>{{ activeBackendLabel }}</span>
      </div>
    </div>

    <div class="explorer-toolbar">
      <div class="toolbar-nav">
        <button class="toolbar-btn" :disabled="currentPane !== 'files' || !canGoBack" title="后退" @click="goBack">
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
        <button class="toolbar-btn" :disabled="currentPane !== 'files' || !canGoForward" title="前进" @click="goForward">
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
        <button class="toolbar-btn" title="刷新" @click="refreshCurrent">
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M13.5 8a5.5 5.5 0 11-1.3-3.56" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M13 1.5v3.5H9.5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
      </div>

      <div class="toolbar-address">
        <svg width="14" height="14" viewBox="0 0 16 16" class="address-icon">
          <path d="M1 3.5C1 2.67 1.67 2 2.5 2h4.29a1.5 1.5 0 011.06.44l.7.7a.5.5 0 00.36.15H13.5c.83 0 1.5.67 1.5 1.5V12.5c0 .83-.67 1.5-1.5 1.5h-11A1.5 1.5 0 011 12.5V3.5z" fill="#ffb900"/>
        </svg>
        <span v-if="currentPane === 'files'" class="address-path">{{ displayPath }}</span>
        <span v-else class="address-path">队列浏览 / {{ activeQueueLabel }}</span>
      </div>

      <div class="toolbar-actions">
        <button class="toolbar-tab" :class="{ active: currentPane === 'files' }" @click="switchPane('files')">文件</button>
        <button class="toolbar-tab" :class="{ active: currentPane === 'queues' }" @click="switchPane('queues')">队列</button>
        <template v-if="currentPane === 'files'">
          <button class="toolbar-btn" :class="{ active: viewMode === 'list' }" title="详细信息" @click="viewMode = 'list'">
            <svg width="14" height="14" viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <button class="toolbar-btn" :class="{ active: viewMode === 'grid' }" title="大图标" @click="viewMode = 'grid'">
            <svg width="14" height="14" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" fill="none"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" fill="none"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" fill="none"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" fill="none"/></svg>
          </button>
        </template>
      </div>
    </div>

    <div class="explorer-body">
      <div class="explorer-sidebar">
        <div class="sidebar-section">
          <div class="sidebar-heading">浏览</div>
          <div class="sidebar-item" :class="{ active: currentPane === 'files' }" @click="switchPane('files')">
            <span class="sidebar-item-icon">🗂</span>
            <span class="sidebar-item-label">文件系统</span>
          </div>
          <div class="sidebar-item" :class="{ active: currentPane === 'queues' }" @click="switchPane('queues')">
            <span class="sidebar-item-icon">📚</span>
            <span class="sidebar-item-label">队列浏览</span>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-heading">存储后端</div>
          <div
            v-for="backend in availableBackends"
            :key="backend.value"
            class="sidebar-item"
            :class="{ active: activeBackend === backend.value }"
            @click="switchBackend(backend.value)"
          >
            <span class="sidebar-item-icon">{{ backendIcon(backend.value) }}</span>
            <span class="sidebar-item-label">{{ backend.label }}</span>
            <span v-if="activeBackend === backend.value" class="sidebar-item-active">✓</span>
          </div>
        </div>

        <div v-if="currentPane === 'files'" class="sidebar-section">
          <div class="sidebar-heading">位置</div>
          <div class="sidebar-item" :class="{ active: currentPathLocal === '/' }" @click="navigateTo('/')">
            <span class="sidebar-item-icon">🖥</span>
            <span class="sidebar-item-label">此电脑</span>
          </div>
          <div class="sidebar-item" :class="{ active: currentPathLocal === '/history' }" @click="navigateTo('/history')">
            <span class="sidebar-item-icon">🎙</span>
            <span class="sidebar-item-label">历史录音</span>
          </div>
          <div class="sidebar-item" :class="{ active: currentPathLocal === '/temp' }" @click="navigateTo('/temp')">
            <span class="sidebar-item-icon">📦</span>
            <span class="sidebar-item-label">临时缓存</span>
          </div>
        </div>

        <div v-else class="sidebar-section">
          <div class="sidebar-heading">队列</div>
          <div
            v-for="queue in queueList"
            :key="queue.id"
            class="sidebar-item"
            :class="{ active: activeQueueId === queue.id }"
            @click="selectQueue(queue.id)"
          >
            <span class="sidebar-item-icon">{{ queue.id === 'temp' ? '📦' : '🗃' }}</span>
            <span class="sidebar-item-label">{{ queue.label }}</span>
            <span v-if="queue.active" class="sidebar-item-badge">使用中</span>
          </div>
        </div>
      </div>

      <div class="explorer-content">
        <template v-if="currentPane === 'files'">
          <div class="content-header">
            <div>
              <div class="content-eyebrow">文件系统提供者</div>
              <div class="content-title">{{ fileContextTitle }}</div>
            </div>
            <div class="content-meta">{{ hasFileProvider || currentPathLocal === '/' ? activeProviderLabel : '当前后端无文件提供者' }}</div>
          </div>

          <div v-if="currentPathLocal !== '/' && !hasFileProvider" class="no-provider-state">
            <div class="state-icon">🧱</div>
            <div class="state-title">当前后端没有文件系统提供者</div>
            <div class="state-desc">这个存储方案更偏向队列写入。请切换到“队列浏览”查看 chunk 数据。</div>
            <button class="state-btn" @click="switchPane('queues')">打开队列浏览</button>
          </div>

          <div v-else-if="loadingFiles" class="explorer-loading">
            <div class="loading-spinner"></div>
            <span>正在读取文件列表…</span>
          </div>

          <div v-else-if="!sortedItems.length" class="explorer-empty">
            <div class="empty-icon">📂</div>
            <div class="empty-title">此位置没有任何文件</div>
            <div class="empty-desc">文件系统提供者当前为空。</div>
          </div>

          <table v-else-if="viewMode === 'list'" class="file-table">
            <thead>
              <tr>
                <th class="col-name" @click="sortBy('name')">名称 <span v-if="sortField === 'name'" class="sort-arrow">{{ sortAsc ? '▲' : '▼' }}</span></th>
                <th class="col-type" @click="sortBy('typeLabel')">类型 <span v-if="sortField === 'typeLabel'" class="sort-arrow">{{ sortAsc ? '▲' : '▼' }}</span></th>
                <th class="col-size" @click="sortBy('size')">大小 <span v-if="sortField === 'size'" class="sort-arrow">{{ sortAsc ? '▲' : '▼' }}</span></th>
                <th class="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in sortedItems"
                :key="item.path || item.name"
                class="file-row"
                :class="{ selected: selectedFile && selectedFile.name === item.name }"
                @click="selectItem(item)"
                @dblclick="openItem(item)"
              >
                <td class="col-name">
                  <span class="file-icon">{{ item.isFolder ? '📁' : fileIcon(item.name) }}</span>
                  <span class="file-name-text">{{ item.name }}</span>
                </td>
                <td class="col-type">{{ item.isFolder ? '文件夹' : (item.typeLabel || '文件') }}</td>
                <td class="col-size">{{ item.isFolder ? '' : (item.sizeLabel || '0') }}</td>
                <td class="col-actions">
                  <button v-if="item.isFolder" class="action-btn" @click.stop="openItem(item)">打开</button>
                  <template v-else>
                    <button class="action-btn" @click.stop="$emit('open', item)">查看</button>
                    <button class="action-btn" @click.stop="$emit('download', item)">下载</button>
                    <button class="action-btn action-btn-danger" @click.stop="$emit('delete', item)">删除</button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="file-grid">
            <div
              v-for="item in sortedItems"
              :key="item.path || item.name"
              class="file-grid-item"
              :class="{ selected: selectedFile && selectedFile.name === item.name }"
              @click="selectItem(item)"
              @dblclick="openItem(item)"
            >
              <div class="grid-icon">{{ item.isFolder ? '📁' : fileIcon(item.name) }}</div>
              <div class="grid-label" :title="item.name">{{ item.name }}</div>
              <div class="grid-size">{{ item.isFolder ? (item.typeLabel || '文件夹') : (item.sizeLabel || '0') }}</div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="queue-overview">
            <div class="overview-card">
              <div class="overview-label">当前队列</div>
              <div class="overview-value">{{ activeQueueLabel }}</div>
            </div>
            <div class="overview-card">
              <div class="overview-label">提供者</div>
              <div class="overview-value">{{ queueProviderLabel }}</div>
            </div>
            <div class="overview-card">
              <div class="overview-label">模式</div>
              <div class="overview-value">{{ queueKindLabel }}</div>
            </div>
            <div class="overview-card">
              <div class="overview-label">状态</div>
              <div class="overview-value"><span class="badge-dot" :class="queueProviderReady ? 'dot-ok' : 'dot-err'"></span>{{ queueProviderReady ? '已就绪' : '未就绪' }}</div>
            </div>
            <div class="overview-card">
              <div class="overview-label">Chunk 数</div>
              <div class="overview-value">{{ queueChunkCount }}</div>
            </div>
            <div class="overview-card">
              <div class="overview-label">总大小</div>
              <div class="overview-value">{{ totalSizeLabel }}</div>
            </div>
          </div>

          <div class="queue-capabilities">
            <span class="caps-label">能力：</span>
            <span v-if="queueCapabilities.streaming" class="cap-tag">流式写入</span>
            <span v-if="queueCapabilities.directURL" class="cap-tag">直接 URL</span>
            <span v-if="queueCapabilities.persistent" class="cap-tag">持久存储</span>
            <span v-if="queueCapabilities.requiresPermission" class="cap-tag cap-perm">需授权</span>
            <span v-if="!queueCapabilities.streaming && !queueCapabilities.directURL && !queueCapabilities.persistent && !queueCapabilities.requiresPermission" class="cap-tag cap-muted">基础</span>
          </div>

          <div class="queue-header">
            <div>
              <div class="content-eyebrow">队列提供者</div>
              <div class="content-title">{{ activeQueueLabel }}</div>
            </div>
            <button class="state-btn" @click="$emit('refresh-queue')">刷新队列</button>
          </div>

          <div v-if="loadingChunks" class="explorer-loading">
            <div class="loading-spinner"></div>
            <span>正在读取队列…</span>
          </div>

          <div v-else-if="!queueChunks.length" class="explorer-empty">
            <div class="empty-icon">📚</div>
            <div class="empty-title">当前队列为空</div>
            <div class="empty-desc">开始录制后，chunk 会出现在这里。</div>
          </div>

          <table v-else class="queue-table">
            <thead>
              <tr>
                <th>#</th>
                <th>大小</th>
                <th>类型</th>
                <th>占比</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(chunk, idx) in queueChunks" :key="idx" class="queue-row">
                <td class="queue-index">#{{ idx }}</td>
                <td>{{ formatSize(chunk.size) }}</td>
                <td>{{ chunk.type || 'blob' }}</td>
                <td>
                  <div class="queue-bar-wrap">
                    <div class="queue-bar" :style="{ width: barWidth(chunk.size) + '%' }"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>

      <div class="explorer-details">
        <div class="details-heading">详细信息</div>
        <template v-if="currentPane === 'files'">
          <template v-if="selectedFile">
            <div class="details-icon">{{ selectedFile.isFolder ? '📁' : fileIcon(selectedFile.name) }}</div>
            <div class="details-title">{{ selectedFile.name }}</div>
            <div class="details-row"><span>类型</span><strong>{{ selectedFile.isFolder ? '文件夹' : (selectedFile.typeLabel || '文件') }}</strong></div>
            <div class="details-row"><span>大小</span><strong>{{ selectedFile.isFolder ? '—' : (selectedFile.sizeLabel || '0') }}</strong></div>
            <div class="details-row"><span>位置</span><strong>{{ fileContextTitle }}</strong></div>
            <div v-if="!selectedFile.isFolder" class="details-actions">
              <button class="details-btn" @click="$emit('open', selectedFile)">查看</button>
              <button class="details-btn" @click="$emit('download', selectedFile)">下载</button>
            </div>
          </template>
          <div v-else class="details-placeholder">选择一个文件或文件夹以查看详细信息。</div>
        </template>
        <template v-else>
          <div class="details-icon">📚</div>
          <div class="details-title">{{ activeQueueLabel }}</div>
          <div class="details-row"><span>Chunk 数</span><strong>{{ queueChunkCount }}</strong></div>
          <div class="details-row"><span>总大小</span><strong>{{ totalSizeLabel }}</strong></div>
          <div class="details-row"><span>平均 Chunk</span><strong>{{ avgChunkLabel }}</strong></div>
          <div class="details-row"><span>提供者</span><strong>{{ queueProviderLabel }}</strong></div>
          <div class="details-row"><span>模式</span><strong>{{ queueKindLabel }}</strong></div>
        </template>
      </div>
    </div>

    <div class="explorer-statusbar">
      <span>{{ currentPane === 'files' ? '文件视图' : '队列视图' }}</span>
      <span v-if="currentPane === 'files'">{{ sortedItems.length }} 个项目</span>
      <span v-else>{{ queueChunkCount }} 个 chunk</span>
      <span v-if="selectedFile && currentPane === 'files'" class="statusbar-selected">已选择：{{ selectedFile.name }}</span>
      <span class="statusbar-spacer"></span>
      <span class="statusbar-provider">
        <span class="statusbar-dot" :class="(currentPane === 'files' ? providerReady : queueProviderReady) ? 'dot-ok' : 'dot-err'"></span>
        {{ currentPane === 'files' ? activeProviderLabel : queueProviderLabel }}
      </span>
      <span class="statusbar-kind">{{ currentPane === 'files' ? providerKindLabel : queueKindLabel }}</span>
    </div>
  </div>
</template>

<script>
import filesize from 'filesize'

export default {
  name: 'StorageExplorer',
  props: {
    availableBackends: {
      type: Array,
      default: function () { return [] },
    },
    activeBackend: {
      type: String,
      default: '',
    },
    providerReady: {
      type: Boolean,
      default: false,
    },
    activeProviderLabel: {
      type: String,
      default: '未知',
    },
    providerKind: {
      type: String,
      default: '',
    },
    items: {
      type: Array,
      default: function () { return [] },
    },
    loadingFiles: {
      type: Boolean,
      default: false,
    },
    currentPath: {
      type: String,
      default: '/',
    },
    hasFileProvider: {
      type: Boolean,
      default: true,
    },
    queueList: {
      type: Array,
      default: function () { return [] },
    },
    activeQueueId: {
      type: String,
      default: '',
    },
    queueChunks: {
      type: Array,
      default: function () { return [] },
    },
    loadingChunks: {
      type: Boolean,
      default: false,
    },
    queueChunkCount: {
      type: Number,
      default: 0,
    },
    queueTotalSize: {
      type: Number,
      default: 0,
    },
    queueProviderLabel: {
      type: String,
      default: '未知',
    },
    queueProviderKind: {
      type: String,
      default: '',
    },
    queueProviderReady: {
      type: Boolean,
      default: false,
    },
    queueCapabilities: {
      type: Object,
      default: function () { return {} },
    },
  },
  data() {
    return {
      currentPane: 'files',
      viewMode: 'list',
      currentPathLocal: this.currentPath || '/',
      selectedName: '',
      sortField: 'name',
      sortAsc: true,
      navHistory: [this.currentPath || '/'],
      navIndex: 0,
    }
  },
  computed: {
    activeBackendLabel() {
      var backend = this.availableBackends.find(function (item) {
        return item.value === this.activeBackend
      }.bind(this))
      return backend ? backend.label : this.activeBackend
    },
    displayPath() {
      var suffix = this.fileContextTitle === '此电脑' ? '' : ' > ' + this.fileContextTitle
      return this.activeBackendLabel + suffix
    },
    fileContextTitle() {
      var map = {
        '/': '此电脑',
        '/history': '历史录音',
        '/temp': '临时缓存',
      }
      return map[this.currentPathLocal] || this.currentPathLocal
    },
    displayItems() {
      return this.items || []
    },
    sortedItems() {
      var field = this.sortField
      var asc = this.sortAsc
      return this.displayItems.slice().sort(function (a, b) {
        if (a.isFolder && !b.isFolder) return -1
        if (!a.isFolder && b.isFolder) return 1
        var va = a[field] == null ? '' : a[field]
        var vb = b[field] == null ? '' : b[field]
        if (typeof va === 'string') va = va.toLowerCase()
        if (typeof vb === 'string') vb = vb.toLowerCase()
        if (va < vb) return asc ? -1 : 1
        if (va > vb) return asc ? 1 : -1
        return 0
      })
    },
    selectedFile() {
      if (!this.selectedName) return null
      return this.sortedItems.find(function (item) {
        return item.name === this.selectedName
      }.bind(this)) || null
    },
    canGoBack() {
      return this.navIndex > 0
    },
    canGoForward() {
      return this.navIndex < this.navHistory.length - 1
    },
    providerKindLabel() {
      return this.kindLabel(this.providerKind)
    },
    queueKindLabel() {
      return this.kindLabel(this.queueProviderKind)
    },
    activeQueueLabel() {
      var queue = this.queueList.find(function (item) {
        return item.id === this.activeQueueId
      }.bind(this))
      return queue ? queue.label : '当前队列'
    },
    totalSizeLabel() {
      return this.queueTotalSize > 0 ? filesize(this.queueTotalSize) : '0'
    },
    avgChunkLabel() {
      if (!this.queueChunkCount) return '—'
      return filesize(Math.round(this.queueTotalSize / this.queueChunkCount))
    },
    maxChunkSize() {
      if (!this.queueChunks.length) return 1
      var max = 0
      for (var i = 0; i < this.queueChunks.length; i++) {
        if (this.queueChunks[i].size > max) max = this.queueChunks[i].size
      }
      return max || 1
    },
  },
  watch: {
    currentPath(value) {
      this.currentPathLocal = value || '/'
    },
  },
  methods: {
    backendIcon(value) {
      var icons = {
        'default': '💾',
        'opfs-streaming': '⚡',
        'local-directory': '📂',
        'hybrid-safe': '🛡️',
        'max-performance': '🚀',
      }
      return icons[value] || '💿'
    },
    fileIcon(name) {
      if (!name) return '📄'
      var ext = name.split('.').pop().toLowerCase()
      var icons = {
        webm: '🎵',
        mp3: '🎵',
        ogg: '🎵',
        wav: '🎵',
        mp4: '🎬',
        mkv: '🎬',
        json: '📋',
        txt: '📝',
      }
      return icons[ext] || '📄'
    },
    kindLabel(value) {
      var map = {
        queue: '队列模式',
        file: '文件模式',
        hybrid: '混合模式',
      }
      return map[value] || '基础模式'
    },
    sortBy(field) {
      if (this.sortField === field) {
        this.sortAsc = !this.sortAsc
      } else {
        this.sortField = field
        this.sortAsc = true
      }
    },
    selectItem(item) {
      this.selectedName = item.name
    },
    openItem(item) {
      if (item.isFolder) {
        this.navigateTo(item.path || (this.currentPathLocal === '/' ? '/' + item.name : this.currentPathLocal + '/' + item.name))
        return
      }
      this.$emit('open', item)
    },
    switchPane(pane) {
      this.currentPane = pane
      this.selectedName = ''
    },
    navigateTo(path) {
      if (path === this.currentPathLocal) return
      this.currentPathLocal = path
      this.selectedName = ''
      this.navHistory = this.navHistory.slice(0, this.navIndex + 1)
      this.navHistory.push(path)
      this.navIndex = this.navHistory.length - 1
      this.$emit('navigate', path)
    },
    goBack() {
      if (!this.canGoBack) return
      this.navIndex -= 1
      this.currentPathLocal = this.navHistory[this.navIndex]
      this.selectedName = ''
      this.$emit('navigate', this.currentPathLocal)
    },
    goForward() {
      if (!this.canGoForward) return
      this.navIndex += 1
      this.currentPathLocal = this.navHistory[this.navIndex]
      this.selectedName = ''
      this.$emit('navigate', this.currentPathLocal)
    },
    refreshCurrent() {
      this.selectedName = ''
      if (this.currentPane === 'queues') {
        this.$emit('refresh-queue')
        return
      }
      this.$emit('refresh-files')
    },
    switchBackend(value) {
      if (value === this.activeBackend) return
      this.currentPathLocal = '/'
      this.selectedName = ''
      this.navHistory = ['/']
      this.navIndex = 0
      this.$emit('switch-backend', value)
      this.$emit('navigate', '/')
    },
    selectQueue(id) {
      this.$emit('select-queue', id)
    },
    formatSize(size) {
      return size > 0 ? filesize(size) : '0'
    },
    barWidth(size) {
      return Math.max(2, Math.round((size / this.maxChunkSize) * 100))
    },
  },
}
</script>

<style scoped>
.storage-explorer {
  display: flex;
  flex-direction: column;
  min-height: 620px;
  border: 1px solid #cdd3db;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  color: #1f2328;
  font-size: 13px;
}

.explorer-titlebar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: linear-gradient(180deg, #f7f8fa 0%, #edf1f5 100%);
  border-bottom: 1px solid #d8dde6;
}

.titlebar-icon {
  display: flex;
  align-items: center;
}

.titlebar-text {
  font-size: 13px;
  font-weight: 700;
}

.titlebar-subtext {
  font-size: 11px;
  color: #6b7280;
}

.titlebar-badge {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #e8edf5;
  font-size: 11px;
}

.badge-dot,
.statusbar-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  display: inline-block;
  margin-right: 4px;
}

.dot-ok {
  background: #107c10;
}

.dot-err {
  background: #d83b01;
}

.explorer-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f5f7fa;
  border-bottom: 1px solid #e1e6ee;
}

.toolbar-nav,
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 3px;
}

.toolbar-btn,
.toolbar-tab,
.state-btn,
.details-btn,
.action-btn {
  border: 1px solid transparent;
  background: transparent;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
}

.toolbar-btn:hover:not(:disabled),
.toolbar-tab:hover,
.state-btn:hover,
.details-btn:hover,
.action-btn:hover {
  background: #e6ebf2;
}

.toolbar-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.toolbar-btn.active,
.toolbar-tab.active {
  background: #dbeafe;
  border-color: #bfdcff;
  color: #005fb8;
}

.toolbar-tab {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.toolbar-address {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid #d7dce5;
  border-radius: 6px;
  background: #fff;
}

.address-path {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.explorer-body {
  display: grid;
  grid-template-columns: 220px 1fr 250px;
  flex: 1;
  min-height: 0;
}

.explorer-sidebar {
  overflow-y: auto;
  border-right: 1px solid #e1e6ee;
  background: #f3f6fb;
  padding: 8px 0;
}

.sidebar-section + .sidebar-section {
  margin-top: 8px;
}

.sidebar-heading {
  padding: 6px 14px 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7b8190;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  color: #243041;
  cursor: pointer;
}

.sidebar-item:hover {
  background: #e8eef7;
}

.sidebar-item.active {
  background: #dcecff;
  color: #005fb8;
  font-weight: 600;
}

.sidebar-item-icon {
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.sidebar-item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-item-active,
.sidebar-item-badge {
  flex-shrink: 0;
  font-size: 10px;
  color: #005fb8;
}

.sidebar-item-badge {
  padding: 1px 6px;
  border-radius: 999px;
  background: #e6f4ea;
  color: #107c10;
}

.explorer-content {
  overflow: auto;
  background: #fff;
}

.content-header,
.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #edf1f6;
}

.content-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7b8190;
}

.content-title {
  margin-top: 3px;
  font-size: 20px;
  font-weight: 700;
}

.content-meta {
  font-size: 12px;
  color: #64748b;
}

.no-provider-state,
.explorer-loading,
.explorer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 320px;
  padding: 24px;
  text-align: center;
}

.state-icon,
.empty-icon {
  font-size: 42px;
}

.state-title,
.empty-title {
  font-size: 18px;
  font-weight: 700;
}

.state-desc,
.empty-desc {
  max-width: 360px;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}

.state-btn,
.details-btn,
.action-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border-color: #d3dae5;
  background: #f8fafc;
}

.file-table,
.queue-table {
  width: 100%;
  border-collapse: collapse;
}

.file-table thead th,
.queue-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 10px 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  color: #525866;
  background: #f8fafc;
  border-bottom: 1px solid #e8edf4;
}

.file-table thead th.col-size,
.file-table tbody td.col-size {
  text-align: right;
}

.col-actions {
  width: 180px;
}

.sort-arrow {
  margin-left: 4px;
  font-size: 10px;
  color: #005fb8;
}

.file-row,
.queue-row {
  transition: background 0.12s ease;
}

.file-row:hover,
.queue-row:hover {
  background: #f5f9ff;
}

.file-row.selected {
  background: #dbeafe;
}

.file-row td,
.queue-row td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f4f8;
  vertical-align: middle;
}

.file-icon {
  margin-right: 8px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  padding: 16px;
}

.file-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px 10px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
}

.file-grid-item:hover {
  background: #f5f9ff;
}

.file-grid-item.selected {
  background: #dbeafe;
}

.grid-icon {
  font-size: 34px;
}

.grid-label {
  margin-top: 8px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-size {
  margin-top: 4px;
  font-size: 11px;
  color: #667085;
}

.queue-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 16px 16px 0;
}

.overview-card {
  padding: 12px;
  border: 1px solid #e7edf4;
  border-radius: 10px;
  background: #fafcff;
}

.overview-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.overview-value {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 700;
}

.queue-capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 16px 4px;
  color: #5b6472;
}

.caps-label {
  font-weight: 600;
}

.cap-tag {
  padding: 2px 8px;
  border-radius: 999px;
  background: #e8f0fe;
  color: #005fb8;
  font-size: 11px;
}

.cap-perm {
  background: #ffe8e3;
  color: #d83b01;
}

.cap-muted {
  background: #eef2f6;
  color: #667085;
}

.queue-index {
  color: #667085;
  font-variant-numeric: tabular-nums;
}

.queue-bar-wrap {
  width: 100%;
  height: 10px;
  background: #eef2f7;
  border-radius: 999px;
  overflow: hidden;
}

.queue-bar {
  height: 100%;
  background: linear-gradient(90deg, #0078d4, #50a0e0);
}

.explorer-details {
  border-left: 1px solid #e1e6ee;
  background: #f8fafc;
  padding: 14px;
  overflow-y: auto;
}

.details-heading {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7b8190;
}

.details-icon {
  margin-top: 18px;
  font-size: 42px;
  text-align: center;
}

.details-title {
  margin-top: 10px;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  word-break: break-word;
}

.details-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e6ebf2;
  font-size: 12px;
}

.details-row span {
  color: #6b7280;
}

.details-row strong {
  text-align: right;
  word-break: break-word;
}

.details-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.details-placeholder {
  margin-top: 18px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
}

.loading-spinner {
  width: 26px;
  height: 26px;
  border: 3px solid #e5ebf2;
  border-top-color: #0078d4;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.explorer-statusbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-top: 1px solid #dfe5ed;
  background: #f4f7fa;
  font-size: 11px;
  color: #5b6472;
}

.statusbar-selected {
  color: #005fb8;
}

.statusbar-spacer {
  flex: 1;
}

.statusbar-provider {
  display: flex;
  align-items: center;
}

.statusbar-kind {
  padding: 2px 8px;
  border-radius: 999px;
  background: #e8edf5;
}

@media (max-width: 1080px) {
  .explorer-body {
    grid-template-columns: 200px 1fr;
  }

  .explorer-details {
    display: none;
  }
}
</style>
