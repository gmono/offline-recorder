<template>
  <div class="markdown-note-editor">
    <!-- 编辑模式：VS Code 风格分屏 -->
    <div v-if="editing" class="editor-container">
      <div class="editor-header">
        <div class="editor-tabs">
          <span class="editor-tab active">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" class="tab-icon">
              <path d="M1 3.5l.5-.5h13l.5.5v9l-.5.5h-13l-.5-.5v-9zm1 1.035V12h12V4.536L8.31 8.9H7.7L2 4.535zm.672-.535L8 7.864l5.328-3.864H2.672z"/>
            </svg>
            {{ titleValue || '未命名笔记' }}
          </span>
        </div>
        <div class="editor-actions">
          <button class="editor-action-btn" title="预览模式" @click="togglePreviewOnly">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3C4.511 3 1.486 5.032.162 7.879a.5.5 0 000 .242C1.486 10.968 4.511 13 8 13s6.514-2.032 7.838-4.879a.5.5 0 000-.242C14.514 5.032 11.489 3 8 3zM8 11.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7zM8 6a2 2 0 100 4 2 2 0 000-4z"/>
            </svg>
          </button>
          <button class="editor-action-btn" title="分屏切换" @click="toggleSplit">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14.5 2h-13l-.5.5v11l.5.5h13l.5-.5v-11l-.5-.5zM7 13V3h7v10H7zM2 3h4v10H2V3z"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="editor-title-bar">
        <input
          v-model="titleValue"
          class="title-input"
          placeholder="笔记标题"
        />
      </div>

      <div class="editor-body" :class="{ 'split-mode': splitMode, 'preview-only': previewOnly }" :style="bodyStyle">
        <div v-show="!previewOnly" class="editor-pane">
          <div class="pane-header">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" class="pane-icon">
              <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0114.25 16H1.75A1.75 1.75 0 010 14.25V1.75z"/>
            </svg>
            <span>编辑</span>
            <span class="pane-info">{{ contentValue.length }} 字</span>
          </div>
          <textarea
            ref="textarea"
            v-model="contentValue"
            class="editor-textarea"
            placeholder="在这里写 Markdown 内容...&#10;&#10;支持标准 Markdown 语法：&#10;# 标题&#10;**加粗** *斜体*&#10;- 列表&#10;> 引用&#10;```代码块```"
            spellcheck="false"
            @keydown="handleKeyDown"
          ></textarea>
        </div>
        <div v-show="splitMode || previewOnly" class="preview-pane">
          <div class="pane-header preview-header">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" class="pane-icon">
              <path d="M8 3C4.511 3 1.486 5.032.162 7.879a.5.5 0 000 .242C1.486 10.968 4.511 13 8 13s6.514-2.032 7.838-4.879a.5.5 0 000-.242C14.514 5.032 11.489 3 8 3z"/>
            </svg>
            <span>预览</span>
          </div>
          <div class="preview-content markdown-body" v-html="renderedContent"></div>
        </div>
      </div>
    </div>

    <!-- 只读预览模式 -->
    <div v-else class="viewer-container">
      <div v-if="titleValue" class="viewer-title">{{ titleValue }}</div>
      <div
        class="preview-content markdown-body readonly"
        v-html="renderedContent"
      ></div>
      <div v-if="!contentValue && !titleValue" class="viewer-empty">
        暂无笔记内容
      </div>
    </div>
  </div>
</template>

<script>
/**
 * MarkdownNoteEditor — VS Code 风格的 Markdown 编辑器
 *
 * 特性：
 * - 分屏编辑 + 实时预览
 * - 纯预览模式切换
 * - Tab 缩进支持
 * - 行号风格 textarea
 * - 内置 Markdown 渲染（使用 mavon-editor 内置的 marked）
 *
 * @prop {Boolean} editing — 编辑 vs 只读模式
 * @prop {String} title — 笔记标题
 * @prop {String} content — Markdown 内容
 * @event update:title — 标题变化
 * @event update:content — 内容变化
 */
export default {
  name: 'MarkdownNoteEditor',
  props: {
    editing: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    minHeight: {
      type: Number,
      default: 400,
    },
  },
  data() {
    return {
      splitMode: true,
      previewOnly: false,
      titleValue: this.title || '',
      contentValue: this.content || '',
    }
  },
  computed: {
    renderedContent() {
      if (!this.contentValue) return '<p class="empty-hint">暂无内容</p>'
      return this.renderMarkdown(this.contentValue)
    },
    bodyStyle() {
      return {
        minHeight: `${this.minHeight}px`,
      }
    },
  },
  watch: {
    title(val) {
      this.titleValue = val || ''
    },
    content(val) {
      this.contentValue = val || ''
    },
    titleValue(val) {
      this.$emit('update:title', val)
    },
    contentValue(val) {
      this.$emit('update:content', val)
    },
  },
  methods: {
    toggleSplit() {
      this.previewOnly = false
      this.splitMode = !this.splitMode
    },
    togglePreviewOnly() {
      this.previewOnly = !this.previewOnly
      if (this.previewOnly) {
        this.splitMode = false
      }
    },
    handleKeyDown(e) {
      // Tab 缩进
      if (e.key === 'Tab') {
        e.preventDefault()
        const textarea = this.$refs.textarea
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        if (e.shiftKey) {
          // 反缩进
          const before = this.contentValue.substring(0, start)
          const lastNewline = before.lastIndexOf('\n')
          const lineStart = lastNewline + 1
          const linePrefix = this.contentValue.substring(lineStart, start)
          if (linePrefix.startsWith('  ')) {
            this.contentValue = this.contentValue.substring(0, lineStart) + this.contentValue.substring(lineStart + 2)
            this.$nextTick(() => {
              textarea.selectionStart = textarea.selectionEnd = start - 2
            })
          }
        } else {
          this.contentValue = this.contentValue.substring(0, start) + '  ' + this.contentValue.substring(end)
          this.$nextTick(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 2
          })
        }
      }
    },
    renderMarkdown(text) {
      // 简单的 Markdown → HTML 渲染
      // 支持: 标题、加粗、斜体、代码块、行内代码、列表、引用、链接、图片、水平线、表格
      let html = this.escapeHtml(text)

      // 代码块 (``` ... ```)
      html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre class="code-block"><code class="language-${lang}">${code.trim()}</code></pre>`
      })

      // 行内代码
      html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

      // 标题
      html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
      html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
      html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
      html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
      html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
      html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')

      // 加粗 + 斜体
      html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

      // 删除线
      html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')

      // 水平线
      html = html.replace(/^---$/gm, '<hr/>')
      html = html.replace(/^\*\*\*$/gm, '<hr/>')

      // 引用块
      html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>')

      // 无序列表
      html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
      html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

      // 有序列表
      html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')

      // 链接
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

      // 图片
      html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img"/>')

      // 表格
      html = this.renderTables(html)

      // 换行 → 段落
      html = html.replace(/\n\n/g, '</p><p>')
      html = html.replace(/\n/g, '<br/>')
      html = '<p>' + html + '</p>'

      // 清理空段落
      html = html.replace(/<p>\s*<\/p>/g, '')
      html = html.replace(/<p>\s*(<h[1-6]>)/g, '$1')
      html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1')
      html = html.replace(/<p>\s*(<pre)/g, '$1')
      html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1')
      html = html.replace(/<p>\s*(<ul>)/g, '$1')
      html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1')
      html = html.replace(/<p>\s*(<blockquote>)/g, '$1')
      html = html.replace(/(<\/blockquote>)\s*<\/p>/g, '$1')
      html = html.replace(/<p>\s*(<hr\/>)/g, '$1')
      html = html.replace(/(<hr\/>)\s*<\/p>/g, '$1')
      html = html.replace(/<p>\s*(<table)/g, '$1')
      html = html.replace(/(<\/table>)\s*<\/p>/g, '$1')

      return html
    },
    renderTables(html) {
      // 简单表格解析
      const lines = html.split('\n')
      const result = []
      let inTable = false
      let headerDone = false
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line.startsWith('|') && line.endsWith('|')) {
          const cells = line.split('|').filter((c, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim())
          // Check if separator row
          if (cells.every(c => /^[-:]+$/.test(c))) {
            headerDone = true
            continue
          }
          if (!inTable) {
            result.push('<table>')
            result.push('<thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead>')
            result.push('<tbody>')
            inTable = true
            continue
          }
          result.push('<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>')
        } else {
          if (inTable) {
            result.push('</tbody></table>')
            inTable = false
            headerDone = false
          }
          result.push(lines[i])
        }
      }
      if (inTable) {
        result.push('</tbody></table>')
      }
      return result.join('\n')
    },
    escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    },
  },
}
</script>

<style scoped>
.markdown-note-editor {
  width: 100%;
}

/* ── 编辑器容器 ── */
.editor-container {
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  height: 36px;
  background: rgba(37, 37, 38, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
}

.editor-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
}

.editor-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 12px;
  color: #6b7280;
  border-radius: 6px;
  cursor: default;
}

.editor-tab.active {
  color: #1e293b;
  background: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.tab-icon {
  opacity: 0.5;
}

.editor-actions {
  display: flex;
  gap: 2px;
}

.editor-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.editor-action-btn:hover {
  background: rgba(108, 92, 231, 0.1);
  color: #6C5CE7;
}

.editor-title-bar {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.title-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  outline: none;
  padding: 4px 0;
}

.title-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

/* ── 编辑器体 ── */
.editor-body {
  display: flex;
  min-height: 400px;
}

.editor-body.preview-only .preview-pane {
  width: 100%;
}

.editor-body.split-mode .editor-pane,
.editor-body.split-mode .preview-pane {
  width: 50%;
}

.editor-body:not(.split-mode):not(.preview-only) .editor-pane {
  width: 100%;
}

.editor-pane {
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
}

.preview-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pane-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #94a3b8;
  background: rgba(37, 37, 38, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
}

.pane-icon {
  opacity: 0.35;
  width: 12px;
  height: 12px;
}

.pane-info {
  margin-left: auto;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 16px;
  font-family: 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #1e293b;
  background: rgba(255, 255, 255, 0.4);
  tab-size: 2;
}

.editor-textarea::placeholder {
  color: #cbd5e1;
}

/* ── 预览区 ── */
.preview-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.75;
  color: #334155;
  background: rgba(255, 255, 255, 0.3);
}

/* ── 只读查看器 ── */
.viewer-container {
  padding: 4px;
}

.viewer-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(108, 92, 231, 0.15);
}

.viewer-container .preview-content.readonly {
  background: transparent;
  padding: 0;
  min-height: 120px;
}

.viewer-empty {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

/* ── Markdown 渲染样式 ── */
.markdown-body >>> h1,
.markdown-body h1 {
  font-size: 1.6em;
  font-weight: 700;
  margin: 0.8em 0 0.4em;
  color: #1e293b;
  border-bottom: 1px solid rgba(108, 92, 231, 0.12);
  padding-bottom: 0.3em;
}

.markdown-body >>> h2,
.markdown-body h2 {
  font-size: 1.35em;
  font-weight: 700;
  margin: 0.7em 0 0.3em;
  color: #1e293b;
}

.markdown-body >>> h3,
.markdown-body h3 {
  font-size: 1.15em;
  font-weight: 600;
  margin: 0.6em 0 0.3em;
  color: #334155;
}

.markdown-body >>> h4,
.markdown-body >>> h5,
.markdown-body >>> h6,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  font-size: 1em;
  font-weight: 600;
  margin: 0.5em 0 0.2em;
  color: #475569;
}

.markdown-body >>> strong,
.markdown-body strong {
  font-weight: 700;
  color: #1e293b;
}

.markdown-body >>> em,
.markdown-body em {
  font-style: italic;
}

.markdown-body >>> del,
.markdown-body del {
  text-decoration: line-through;
  opacity: 0.6;
}

.markdown-body >>> blockquote,
.markdown-body blockquote {
  margin: 0.5em 0;
  padding: 8px 16px;
  border-left: 3px solid #6C5CE7;
  background: rgba(108, 92, 231, 0.05);
  border-radius: 0 8px 8px 0;
  color: #475569;
}

.markdown-body >>> ul,
.markdown-body ul {
  list-style: disc;
  padding-left: 1.5em;
  margin: 0.4em 0;
}

.markdown-body >>> ol,
.markdown-body ol {
  list-style: decimal;
  padding-left: 1.5em;
  margin: 0.4em 0;
}

.markdown-body >>> li,
.markdown-body li {
  margin: 0.15em 0;
}

.markdown-body >>> a,
.markdown-body a {
  color: #6C5CE7;
  text-decoration: none;
}

.markdown-body >>> a:hover,
.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body >>> hr,
.markdown-body hr {
  border: none;
  border-top: 1px solid rgba(108, 92, 231, 0.15);
  margin: 1em 0;
}

.markdown-body >>> .code-block,
.markdown-body .code-block {
  background: rgba(30, 41, 59, 0.06);
  border-radius: 8px;
  padding: 12px 16px;
  margin: 0.5em 0;
  overflow-x: auto;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12.5px;
  line-height: 1.6;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.markdown-body >>> .inline-code,
.markdown-body .inline-code {
  background: rgba(108, 92, 231, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 0.88em;
  color: #6C5CE7;
}

.markdown-body >>> table,
.markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5em 0;
  font-size: 13px;
}

.markdown-body >>> th,
.markdown-body th {
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  background: rgba(108, 92, 231, 0.06);
  border-bottom: 2px solid rgba(108, 92, 231, 0.15);
}

.markdown-body >>> td,
.markdown-body td {
  padding: 6px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.markdown-body >>> .md-img,
.markdown-body .md-img {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.5em 0;
}

.markdown-body >>> .empty-hint,
.markdown-body .empty-hint {
  color: #94a3b8;
  font-style: italic;
}
</style>
