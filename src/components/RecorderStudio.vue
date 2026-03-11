<template>
  <div class="relative px-4 pb-8 pt-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-[1480px]">
      <header class="mb-4 sm:mb-5">
        <p class="panel-title mb-3">Offline Recorder · Reimagined</p>
        <h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
          通用离线录音器
        </h1>
        <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
          参考 WASM 录音器的玻璃质感界面，保留断点续录、历史记录、标记点与紧急导出能力。
        </p>
      </header>

      <div class="grid items-start gap-4 md:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)]">
        <div class="space-y-4">
          <UiCard eyebrow="Recorder" title="当前录制工作台" subtitle="选择媒体源后即可开始录制，支持音频、视频、录屏与内部音源。">
            <div class="grid items-start gap-4 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
              <div class="glass-soft p-5">
                <p class="section-title mb-3">状态</p>
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div class="text-4xl font-black tracking-[0.18em] text-slate-900 sm:text-5xl">
                      {{ recordTime }}
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <span :class="statusClass">{{ statusText }}</span>
                      <span class="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-500">
                        {{ recordingInfo.recordType === 'video' ? 'Video' : 'Audio' }}
                      </span>
                      <span class="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-500">
                        {{ sizeDesc }}
                      </span>
                    </div>
                  </div>
                  <div class="min-w-[180px] text-right text-xs text-slate-500">
                    <div>开始：{{ formatDate(startTime) }}</div>
                    <div class="mt-1">结束：{{ formatDate(endTime) }}</div>
                    <div class="mt-1">媒体源：{{ sourceLabel }}</div>
                  </div>
                </div>

                <div class="mt-6 overflow-hidden rounded-[12px] border border-[#e2e4ea] bg-[#f0f2f5] p-4">
                  <video
                    v-show="recordingInfo.recordType === 'video'"
                    ref="record_video_player"
                    class="max-h-[320px] w-full rounded-[8px] bg-[#1e1e1e] object-contain"
                    muted
                    playsinline
                  />
                  <WaveformCanvas
                    v-show="recordingInfo.recordType !== 'video'"
                    :active="nowState === 'recording' || nowState === 'paused'"
                    :analyser-node="analyserNode"
                    :height="180"
                    class="rounded-[18px]"
                  />
                </div>
              </div>

              <div class="space-y-4">
                <div class="glass-soft p-5">
                  <p class="section-title mb-3">工作区设置</p>
                  <div class="grid items-start gap-4 md:grid-cols-2">
                    <div>
                      <p class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">媒体源与参数</p>
                      <SelectSource :value.sync="selectMediaValue" :show-help="false" @select="sourceSelect" />
                    </div>

                    <div class="space-y-3">
                      <div>
                        <label class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">存储方案</label>
                        <select
                          v-model="storageBackendKind"
                          class="w-full rounded-lg border border-[#d1d5db] bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20"
                          :disabled="nowState === 'recording' || loading"
                          @change="handleStorageBackendChange"
                        >
                          <option
                            v-for="opt in storageBackendOptions"
                            :key="opt.value"
                            :value="opt.value"
                            :disabled="opt.value === 'opfs' && !supportsOPFS || opt.value.includes('opfs') && !supportsOPFS || opt.value.includes('directory') && !supportsDirectoryAccess"
                          >{{ opt.label }}</option>
                        </select>
                        <p class="mt-1.5 text-xs leading-5 text-slate-400">{{ storageBackendDescription }}</p>
                      </div>

                      <div v-if="storageUsesDirectory" class="glass-soft px-4 py-3">
                        <div class="flex items-center justify-between gap-3">
                          <div class="min-w-0">
                            <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">本地目录</div>
                            <div class="mt-1 text-sm" :class="directoryBound ? 'text-emerald-700' : 'text-amber-600'">
                              {{ directoryBound ? '已绑定' : '未绑定 — 当前回退到 IndexedDB' }}
                            </div>
                          </div>
                          <UiButton
                            size="sm"
                            :variant="directoryBound ? 'secondary' : 'primary'"
                            @click="bindLocalDirectory"
                            :disabled="loading"
                          >{{ directoryBound ? '重新绑定' : '选择目录' }}</UiButton>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 text-xs text-slate-400">
                        <span
                          class="inline-block h-2 w-2 rounded-full"
                          :class="storageReady ? 'bg-emerald-400' : 'bg-amber-400'"
                        ></span>
                        <span>当前：{{ activeStorageLabel }}</span>
                      </div>
                      <p v-if="storageStatusMessage" class="text-xs leading-5 text-slate-400">{{ storageStatusMessage }}</p>
                    </div>
                  </div>

                  <div class="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span class="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2">
                      <span class="font-semibold text-slate-400">记录点</span>
                      <strong class="text-slate-900">{{ activePoints.length }}</strong>
                    </span>
                    <span class="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2">
                      <span class="font-semibold text-slate-400">历史数</span>
                      <strong class="text-slate-900">{{ historyBlobsIdx.length }}</strong>
                    </span>
                    <span class="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2">
                      <span class="font-semibold text-slate-400">后端</span>
                      <strong class="text-slate-900">{{ activeStorageLabel }}</strong>
                    </span>
                    <span class="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2">
                      <span class="font-semibold text-slate-400">媒体源</span>
                      <strong class="text-slate-900">{{ sourceLabel }}</strong>
                    </span>
                  </div>

                  <div class="mt-4 flex flex-wrap gap-2">
                    <UiButton size="sm" variant="primary" @click="openStorageExplorer">打开文件管理器</UiButton>
                    <UiButton size="sm" variant="secondary" @click="show_player">播放列表</UiButton>
                  </div>

                  <div class="mt-4 rounded-2xl border border-[#dce1ea] bg-white/72 px-4 py-4">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p class="section-title mb-1">故障恢复</p>
                        <p class="text-sm leading-6 text-slate-500">需要兜底时可立即导出缓存并复位。</p>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        <UiButton size="sm" variant="danger" @click="forceDownload">紧急下载缓存</UiButton>
                        <UiButton size="sm" variant="warning" @click="forceClear">强制结束并清空缓存</UiButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 grid items-start gap-4 md:grid-cols-[0.72fr_1.28fr]">
              <div class="glass-soft p-5">
                <p class="section-title mb-3">录制控制与记录点</p>
                <div v-if="loading || stopping" class="mb-4 rounded-2xl bg-slate-900/6 px-4 py-3 text-sm text-slate-600">
                  {{ loading ? '正在初始化录音环境…' : '正在整理最后一段数据并保存…' }}
                </div>

                <div class="flex flex-wrap gap-3">
                  <UiButton v-if="nowState === 'normal' || nowState === 'stopped'" variant="primary" @click="start">开始</UiButton>
                  <UiButton v-if="nowState === 'paused'" variant="success" @click="resume">继续</UiButton>
                  <UiButton v-if="nowState === 'recording'" variant="secondary" @click="pause">暂停</UiButton>
                  <UiButton v-if="nowState === 'recording' || nowState === 'paused'" variant="danger" @click="stop">停止</UiButton>
                  <UiButton v-if="nowState === 'stopped'" variant="secondary" @click="play">播放</UiButton>
                  <UiButton v-if="nowState === 'stopped'" variant="secondary" @click="download">下载当前录音</UiButton>
                  <UiButton v-if="nowState === 'stopped' && nowRecordInfo" variant="warning" @click="removeNow">删除当前</UiButton>
                </div>

                <div class="mt-4 border-t border-[#e2e4ea] pt-4">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <p class="section-title">时间轴与标记</p>
                    <div class="flex flex-wrap gap-2">
                      <UiButton v-if="nowState === 'recording'" size="sm" variant="secondary" @click="addPoint">添加标记点</UiButton>
                      <UiButton size="sm" variant="secondary" @click="addNote">新建 Markdown 笔记</UiButton>
                    </div>
                  </div>
                  <div class="mt-4">
                    <RecordingPointList :points="activePoints" @view="showRecordingPoint" />
                  </div>
                </div>
              </div>

              <div class="glass-soft p-5">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="section-title mb-2">Markdown 笔记工作区</p>
                    <p class="text-sm leading-6 text-slate-500">{{ noteWorkspaceHint }}</p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <UiButton size="sm" variant="secondary" @click="addNote">新建笔记</UiButton>
                    <UiButton v-if="noteEditorVisible" size="sm" variant="secondary" @click="note_cancel">取消</UiButton>
                    <UiButton v-if="noteEditorVisible" size="sm" variant="success" @click="note_confirm">保存笔记</UiButton>
                  </div>
                </div>

                <div class="mt-4">
                  <MarkdownNoteEditor
                    v-if="noteEditorVisible"
                    :editing="true"
                    :title.sync="nowEditNote.title"
                    :content.sync="nowEditNote.content"
                    :min-height="300"
                  />
                  <div v-else class="rounded-2xl border border-dashed border-[#d7dce6] bg-white/55 px-5 py-6 text-sm leading-7 text-slate-500">
                    <p>点击“新建笔记”即可直接输入 Markdown，保存后会自动挂到当前时间点。</p>
                    <p class="mt-2">点击左侧已有记录点，也会把对应笔记载入编辑器继续补充。</p>
                  </div>
                </div>
              </div>
            </div>
          </UiCard>
        </div>

        <div class="space-y-4 md:sticky md:top-4">
          <UiCard eyebrow="Preview" title="当前片段" subtitle="停止录制后可在这里预览、重命名与继续管理。">
            <div v-if="src && nowRecordInfo" class="space-y-4">
              <MediaPreviewPlayer
                ref="player"
                :src="src"
                :type="nowRecordInfo.recordType || recordingInfo.recordType || 'audio'"
                :title="nowRecordInfo.name"
                :fallback-duration="nowRecordInfo.length || 0"
                :viewport-height="280"
              />
              <div class="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div class="glass-soft px-4 py-3">
                  <div class="text-xs uppercase tracking-[0.2em] text-slate-400">名称</div>
                  <div class="mt-2 font-semibold text-slate-900">{{ nowRecordInfo.name }}</div>
                </div>
                <div class="glass-soft px-4 py-3">
                  <div class="text-xs uppercase tracking-[0.2em] text-slate-400">长度</div>
                  <div class="mt-2 font-semibold text-slate-900">{{ secondToTime(nowRecordInfo.length) }}</div>
                </div>
                <div class="glass-soft px-4 py-3">
                  <div class="text-xs uppercase tracking-[0.2em] text-slate-400">开始时间</div>
                  <div class="mt-2 font-semibold text-slate-900">{{ formatDate(nowRecordInfo.startTime) }}</div>
                </div>
                <div class="glass-soft px-4 py-3">
                  <div class="text-xs uppercase tracking-[0.2em] text-slate-400">结束时间</div>
                  <div class="mt-2 font-semibold text-slate-900">{{ formatDate(nowRecordInfo.endTime) }}</div>
                </div>
              </div>
            </div>
            <div v-else class="glass-soft px-4 py-6 text-sm leading-6 text-slate-500">
              当前还没有加载任何录音。停止录制后会自动生成可预览片段，也可以在右侧历史列表中切换查看。
            </div>
          </UiCard>

          <UiCard eyebrow="Library" title="历史录音" subtitle="主页不再平铺浏览，统一通过文件管理器查看文件系统提供者与队列提供者。">
            <div class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div class="glass-soft px-4 py-4">
                <div class="grid gap-3 sm:grid-cols-3">
                  <div>
                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400">记录总数</div>
                    <div class="mt-2 text-lg font-semibold text-slate-900">{{ historyItems.length }}</div>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400">当前后端</div>
                    <div class="mt-2 text-sm font-semibold text-slate-900">{{ activeStorageLabel }}</div>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Provider 模式</div>
                    <div class="mt-2 text-sm font-semibold text-slate-900">{{ providerKindText(explorerProviderKind) }}</div>
                  </div>
                </div>
                <p class="mt-4 text-sm leading-6 text-slate-500">
                  录音文件、底层 Provider 文件以及队列 chunk 都统一在“文件管理器”里浏览；播放预览仍然通过播放列表打开。
                </p>
              </div>
              <div class="flex flex-wrap items-start justify-end gap-2">
                <UiButton size="sm" variant="primary" @click="openStorageExplorer">打开文件管理器</UiButton>
                <UiButton size="sm" variant="secondary" @click="show_player">打开播放列表</UiButton>
                <UiButton size="sm" variant="secondary" @click="downloadAll">全部下载</UiButton>
                <UiButton size="sm" variant="warning" @click="downloadAll_packed">ZIP 打包</UiButton>
                <UiButton size="sm" variant="danger" @click="clear">清空</UiButton>
              </div>
            </div>
          </UiCard>

          <UiCard eyebrow="Cloud" title="云账号与后端" subtitle="支持单点登录、账号授权、VIP 密钥、广告奖励临时时长与每日 0 点结算；检测到 token 后自动开放云后端。">
            <div class="space-y-4">
              <div class="glass-soft px-4 py-4">
                <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cloud API</label>
                <div class="flex flex-col gap-2 sm:flex-row">
                  <input
                    v-model.trim="cloudApiBaseUrl"
                    type="text"
                    class="min-w-0 flex-1 rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20"
                    placeholder="http://127.0.0.1:9531"
                  >
                  <UiButton size="sm" variant="secondary" :disabled="cloudActionLoading" @click="applyCloudApiBase">保存地址</UiButton>
                  <UiButton v-if="cloudLoggedIn" size="sm" variant="secondary" :disabled="cloudActionLoading" @click="refreshCloudSession()">刷新</UiButton>
                </div>
              </div>

              <div v-if="cloudLoggedIn" class="space-y-3">
                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div class="glass-soft px-4 py-3 text-sm text-slate-600">
                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400">账号</div>
                    <div class="mt-2 font-semibold text-slate-900">{{ cloudSession.username }}</div>
                  </div>
                  <div class="glass-soft px-4 py-3 text-sm text-slate-600">
                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400">余额</div>
                    <div class="mt-2 font-semibold text-slate-900">{{ cloudBalanceText }}</div>
                  </div>
                  <div class="glass-soft px-4 py-3 text-sm text-slate-600">
                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400">VIP</div>
                    <div class="mt-2 font-semibold text-slate-900">{{ cloudVipText }}</div>
                  </div>
                  <div class="glass-soft px-4 py-3 text-sm text-slate-600">
                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400">登录策略</div>
                    <div class="mt-2 font-semibold text-slate-900">{{ cloudSessionModeText }}</div>
                    <div class="mt-1 text-xs text-slate-400">{{ cloudSessionExpiryText }}</div>
                  </div>
                  <div class="glass-soft px-4 py-3 text-sm text-slate-600">
                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400">账号授权</div>
                    <div class="mt-2 font-semibold text-slate-900">{{ cloudAuthorizationText }}</div>
                    <div class="mt-1 text-xs text-slate-400">{{ cloudAuthorizationDetailText }}</div>
                  </div>
                  <div class="glass-soft px-4 py-3 text-sm text-slate-600">
                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400">临时时长</div>
                    <div class="mt-2 font-semibold text-slate-900">{{ cloudTempAccessText }}</div>
                    <div class="mt-1 text-xs text-slate-400">{{ cloudSettlementText }}</div>
                  </div>
                  <div class="glass-soft px-4 py-3 text-sm text-slate-600">
                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400">广告奖励</div>
                    <div class="mt-2 font-semibold text-slate-900">{{ cloudRewardText }}</div>
                    <div class="mt-1 text-xs text-slate-400">{{ cloudRewardDetailText }}</div>
                  </div>
                  <div class="glass-soft px-4 py-3 text-sm text-slate-600">
                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400">后端状态</div>
                    <div class="mt-2 font-semibold" :class="cloudBackendActive ? 'text-emerald-700' : 'text-slate-900'">
                      {{ cloudBackendActive ? '云后端已启用' : '当前仍是本地后端' }}
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UiButton size="sm" variant="primary" :disabled="cloudActionLoading || cloudBackendActive" @click="switchToCloudBackend">切到云后端</UiButton>
                  <UiButton size="sm" variant="secondary" :disabled="cloudActionLoading" @click="createCloudRecharge('wechat')">微信充值</UiButton>
                  <UiButton size="sm" variant="secondary" :disabled="cloudActionLoading" @click="createCloudRecharge('alipay')">支付宝充值</UiButton>
                  <UiButton size="sm" variant="secondary" :disabled="cloudActionLoading" @click="redeemCloudVipKey">密钥开通</UiButton>
                  <UiButton size="sm" variant="success" :disabled="cloudActionLoading" @click="activateCloudVip">开通 VIP</UiButton>
                  <UiButton size="sm" variant="secondary" :disabled="cloudActionLoading" @click="watchRewardedCloudAd">看广告赚时长</UiButton>
                  <UiButton size="sm" variant="warning" :disabled="cloudActionLoading" @click="logoutCloud">退出登录</UiButton>
                </div>

                <div v-if="recentCloudOrders.length" class="glass-soft px-4 py-4 text-sm leading-6 text-slate-600">
                  <div class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">最近订单</div>
                  <div
                    v-for="order in recentCloudOrders"
                    :key="order.id"
                    class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 py-2 last:border-b-0"
                  >
                    <div>
                      <div class="font-semibold text-slate-900">{{ order.provider_label }} · ¥{{ (order.amount_cents / 100).toFixed(2) }}</div>
                      <div class="text-xs text-slate-400">{{ formatDate(order.created_at * 1000) }}</div>
                    </div>
                    <span class="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-500">{{ order.status }}</span>
                  </div>
                </div>
              </div>

              <div v-else class="glass-soft px-4 py-4">
                <div class="grid gap-3">
                  <input
                    v-model.trim="cloudForm.username"
                    type="text"
                    class="rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20"
                    placeholder="用户名"
                  >
                  <input
                    v-model="cloudForm.password"
                    type="password"
                    class="rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20"
                    placeholder="密码（至少 6 位）"
                  >
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <UiButton size="sm" variant="primary" :disabled="cloudActionLoading" @click="registerCloud">注册</UiButton>
                  <UiButton size="sm" variant="secondary" :disabled="cloudActionLoading" @click="loginCloud">登录</UiButton>
                </div>
                <p class="mt-3 text-xs leading-5 text-slate-400">登录成功后会自动开放“云后端”选项，并可把临时队列与历史录音同步到 Rust 服务。</p>
              </div>
            </div>
          </UiCard>

          <AdBanner slot-id="sidebar-1" format="banner" class="mt-1" />
          <AdDashboard />
        </div>
      </div>
    </div>

    <UiDialog v-model="showPlayer" title="播放列表" eyebrow="Player" width="1120px" fullscreen>
      <div class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <UiCard padded eyebrow="Selected" title="当前播放片段">
          <div v-if="src && nowRecordInfo" class="space-y-4">
            <MediaPreviewPlayer
              :src="src"
              :type="nowRecordInfo.recordType || recordingInfo.recordType || 'audio'"
              :title="nowRecordInfo.name"
              :fallback-duration="nowRecordInfo.length || 0"
              :viewport-height="360"
            />
            <RecordingPointList :points="nowRecordInfo.points || []" @view="showRecordingPoint" />
          </div>
          <div v-else class="glass-soft px-4 py-6 text-sm text-slate-500">请选择一条录音查看内容。</div>
        </UiCard>
        <RecordingHistoryList
          :items="historyItems"
          :active-id="nowRecordInfo ? nowRecordInfo.id : ''"
          @select="select"
          @download="playlist_download"
          @rename="playlist_rename"
          @remove="playlist_del"
        />
      </div>
    </UiDialog>

    <UiDialog v-model="showStorageExplorer" title="文件管理器" eyebrow="Explorer" width="1180px" fullscreen>
      <StorageExplorer
        :available-backends="storageBackendOptions"
        :active-backend="activeStorageBackendKind"
        :provider-ready="storageReady"
        :active-provider-label="activeExplorerProviderLabel"
        :provider-kind="explorerProviderKind"
        :items="explorerFiles"
        :loading-files="explorerLoading"
        :current-path="explorerPath"
        :has-file-provider="hasExplorerFileProvider"
        :queue-list="queueListForInspector"
        :active-queue-id="activeQueueId"
        :queue-chunks="queueChunks"
        :loading-chunks="queueLoading"
        :queue-chunk-count="queueChunkCount"
        :queue-total-size="queueTotalSize"
        :queue-provider-label="activeQueueProviderLabel"
        :queue-provider-kind="activeQueueProviderKind"
        :queue-provider-ready="activeQueueProviderReady"
        :queue-capabilities="activeQueueProviderCaps"
        @switch-backend="handleExplorerSwitchBackend"
        @navigate="handleExplorerNavigate"
        @refresh-files="loadExplorerFiles"
        @refresh-queue="loadQueueChunks"
        @select-queue="handleQueueSelect"
        @download="handleExplorerDownload"
        @delete="handleExplorerDelete"
        @open="handleExplorerOpen"
      />
    </UiDialog>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import filesize from 'filesize'
import store from 'store2'
import downloadjs from 'js-file-downloader'
import saver from 'streamsaver'
import { streamingDownloadFile, streamingZipDownload } from '@/libs/streamingDownload'

import { getDescriptOfSize2 } from '@/lib'
import {
  createProviderFromPreset,
  createProviderSmart,
  getAvailablePresets,
  listPresets,
  getPreset,
} from '@/libs/presets'
import { asQueue, asFile } from '@/libs/providers/common'
import { DirectoryFileProvider } from '@/libs/providers/DirectoryFileProvider'
import SelectSource, { getMedia } from '@/components/SelectSource.vue'
import RecordingHistoryList from '@/components/recorder/RecordingHistoryList.vue'
import RecordingPointList from '@/components/recorder/RecordingPointList.vue'
import MediaPreviewPlayer from '@/components/recorder/MediaPreviewPlayer.vue'
import WaveformCanvas from '@/components/recorder/WaveformCanvas.vue'
import MarkdownNoteEditor from '@/components/recorder/MarkdownNoteEditor.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiDialog from '@/components/ui/UiDialog.vue'
import AdBanner from '@/components/ads/AdBanner.vue'
import AdDashboard from '@/components/ads/AdDashboard.vue'
import StorageExplorer from '@/components/storage/StorageExplorer.vue'
import { getAdManager } from '@/libs/ads/AdManager'
import { getPreferredProvider } from '@/libs/ads/bootstrap'
import {
  clearCloudSession,
  cloudActivateVip,
  cloudBillingSummary,
  cloudClaimAdReward,
  cloudConfirmRechargeOrder,
  cloudCreateRechargeOrder,
  cloudLogin,
  cloudLogout,
  cloudRedeemVipKey,
  cloudRegister,
  getCloudApiBaseUrl,
  getStoredCloudUser,
  hasCloudToken,
  setCloudApiBaseUrl,
} from '@/libs/cloud/api'

const historyKey = 'historyBlobs'
const historyFilePrefix = historyKey + '__'
const infoMap = 'historyBlobsInfoMap'
const historyMetaFile = '__meta_history_index.json'
const recordingInfoKey = 'recordingInfo'
const storagePreferenceKey = 'recordingStorageBackendKind'
const directoryHandleMemoryKey = 'offline-recorder-storage-directory'
const sleep = (ms = 0) => new Promise((resolve) => window.setTimeout(resolve, ms))

function historyFileKey(id) {
  return historyFilePrefix + encodeHistoryId(id) + '.webm'
}

function legacyHistoryFileKey(id) {
  return historyKey + id
}

function parseHistoryFileId(filename) {
  if (!filename) return ''
  if (filename.indexOf(historyFilePrefix) === 0 && filename.slice(-5) === '.webm') {
    try {
      return decodeHistoryId(filename.slice(historyFilePrefix.length, -5))
    } catch (error) {
      return filename.slice(historyFilePrefix.length, -5)
    }
  }
  if (filename.indexOf(historyKey) === 0) {
    return filename.slice(historyKey.length)
  }
  return ''
}

function encodeHistoryId(id) {
  try {
    return btoa(String(id)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  } catch (error) {
    return String(id).replace(/[^a-zA-Z0-9_-]/g, '_')
  }
}

function decodeHistoryId(value) {
  var normalized = String(value).replace(/-/g, '+').replace(/_/g, '/')
  while (normalized.length % 4) {
    normalized += '='
  }
  try {
    return atob(normalized)
  } catch (error) {
    return value
  }
}

const ALL_PRESETS = listPresets()

function createEmptyRecordingInfo() {
  return {
    recordType: 'audio',
    source: 'mic',
    points: [],
    alerady_saved: false,
    size: 0,
  }
}

function createDefaultCloudBilling() {
  return {
    vip_monthly_price_cents: 980,
    vip_monthly_price_yuan: 9.8,
    orders: [],
    session: {
      single_login: true,
      created_at: 0,
      expires_at: 0,
    },
    authorization: {
      account_authorized: false,
      force_vip: false,
      labels: [],
      included_temp_access_seconds: 0,
      overdraft_limit_seconds: 3600,
    },
    access: {
      temp_access_seconds: 0,
      pending_temp_access_seconds: 0,
      included_temp_access_seconds: 0,
      effective_temp_access_seconds: 0,
      effective_temp_access_minutes: 0,
      overdraft_limit_seconds: 3600,
      available_with_overdraft_seconds: 3600,
      overdraft_in_use: false,
      rewarded_ad_count_today: 0,
      rewarded_ad_daily_limit: 0,
      rewarded_ad_seconds_today: 0,
      consumed_seconds_today: 0,
      next_settlement_at: 0,
    },
  }
}

function getDefaultPresetName() {
  const opfs = getPreset('opfs-streaming')
  return opfs && opfs.isAvailable() ? 'opfs-streaming' : 'default'
}

function normalizePresetName(value) {
  const preset = ALL_PRESETS.find((p) => p.name === value)
  return preset && preset.isAvailable() ? value : getDefaultPresetName()
}

export default {
  name: 'RecorderStudio',
  components: {
    RecordingHistoryList,
    RecordingPointList,
    MediaPreviewPlayer,
    SelectSource,
    MarkdownNoteEditor,
    UiButton,
    UiCard,
    UiDialog,
    AdBanner,
    AdDashboard,
    WaveformCanvas,
    StorageExplorer,
  },
  data() {
    const initialBackend = normalizePresetName(store.get(storagePreferenceKey))

    return {
      selectMediaValue: 'mic',
      loading: false,
      stopping: false,
      recorder: null,
      nowState: 'normal',
      recordingInfo: createEmptyRecordingInfo(),
      startTime: new Date(),
      endTime: new Date(),
      chunkCount: 0,
      inMemoryChunks: [],
      mergedBlob: null,
      src: '',
      historyBlobsIdx: [],
      historyInfoMap: {},
      historyItems: [],
      nowRecordInfo: null,
      isNoteEditing: false,
      isShowingNote: false,
      showPlayer: false,
      nowShowedNote: {},
      nowEditNote: {
        title: '',
        content: '',
      },
      editingPointIndex: -1,
      waveformBars: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      audioContext: null,
      analyserNode: null,
      supportsOPFS: getPreset('opfs-streaming')?.isAvailable() ?? false,
      supportsDirectoryAccess: getPreset('local-directory')?.isAvailable() ?? false,
      storageBackendKind: initialBackend,
      activeStorageBackendKind: initialBackend,
      storageBackendOptions: getAvailablePresets().map((p) => ({ value: p.name, label: p.label, description: p.description })),
      storageReady: false,
      storageStatusMessage: '',
      directoryBound: false,
      tempProvider: null,
      historyProvider: null,
      // Explorer & Queue Inspector
      showStorageExplorer: false,
      explorerFiles: [],
      explorerLoading: false,
      explorerPath: '/',
      queueChunks: [],
      queueChunkCount: 0,
      queueTotalSize: 0,
      queueLoading: false,
      activeQueueId: 'temp',
      cloudApiBaseUrl: getCloudApiBaseUrl(),
      cloudSession: getStoredCloudUser(),
      cloudBilling: createDefaultCloudBilling(),
      cloudActionLoading: false,
      cloudForm: {
        username: '',
        password: '',
      },
    }
  },
  computed: {
    sizeDesc() {
      return getDescriptOfSize2(this.recordingInfo.size, ['byte', 'KB', 'MB', 'GB'], [1024, 1024, 1024])
    },
    recordTime() {
      return dayjs(0).second(this.chunkCount).subtract(8, 'hours').format('HH:mm:ss')
    },
    statusText() {
      return {
        normal: '待命',
        recording: '录制中',
        paused: '已暂停',
        stopped: '已完成',
        merging: '整理中',
      }[this.nowState] || '待命'
    },
    statusClass() {
      return {
        normal: 'rounded-full bg-[#6C5CE7]/10 px-3 py-1 text-xs font-semibold text-[#6C5CE7]',
        recording: 'rounded-full bg-[#FF6B9D]/12 px-3 py-1 text-xs font-semibold text-[#E5467A]',
        paused: 'rounded-full bg-amber-400/16 px-3 py-1 text-xs font-semibold text-amber-700',
        stopped: 'rounded-full bg-emerald-400/14 px-3 py-1 text-xs font-semibold text-emerald-700',
        merging: 'rounded-full bg-sky-400/14 px-3 py-1 text-xs font-semibold text-sky-700',
      }[this.nowState] || 'rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-600'
    },
    sourceLabel() {
      return {
        mic: '麦克风',
        capture: '摄像头',
        screen: '录屏',
        audiooutput: '内部音源',
      }[this.selectMediaValue] || this.selectMediaValue
    },
    activePoints() {
      if (this.nowRecordInfo && Array.isArray(this.nowRecordInfo.points)) {
        return this.nowRecordInfo.points
      }
      return this.recordingInfo.points || []
    },
    noteEditorVisible() {
      return this.isNoteEditing || Boolean(this.nowEditNote.title || this.nowEditNote.content)
    },
    noteWorkspaceHint() {
      if (this.editingPointIndex >= 0) {
        return '当前正在编辑已有记录点的 Markdown 笔记，左侧输入、右侧实时预览。'
      }
      if (this.nowState === 'recording' || this.nowState === 'paused') {
        return '录制过程中可直接撰写 Markdown，保存时会自动插入一个带笔记的时间点。'
      }
      if (this.activePoints.length > 0) {
        return '点击左侧记录点即可继续补充对应笔记，也可以新建一条 Markdown 说明。'
      }
      return '开始录制后，可在这里直接编写 Markdown 笔记，方便边录边记。'
    },
    cloudLoggedIn() {
      return Boolean(this.cloudSession && this.cloudSession.username && hasCloudToken())
    },
    cloudAvailable() {
      return this.storageBackendOptions.some((item) => item.value === 'cloud')
    },
    cloudBackendActive() {
      return this.activeStorageBackendKind === 'cloud'
    },
    cloudBalanceText() {
      const cents = this.cloudSession?.balance_cents || 0
      return `¥${(cents / 100).toFixed(2)}`
    },
    cloudVipText() {
      if (this.cloudBilling?.authorization?.force_vip || this.cloudSession?.force_vip_authorized) {
        return '账号自带授权 VIP'
      }
      if (!this.cloudSession || !this.cloudSession.vip_expires_at || !this.cloudSession.is_vip) {
        return '未开通'
      }
      return `有效期至 ${this.formatDate(this.cloudSession.vip_expires_at * 1000)}`
    },
    cloudSessionModeText() {
      return this.cloudBilling?.session?.single_login ? '单点在线（新登录会挤掉旧会话）' : '多会话'
    },
    cloudSessionExpiryText() {
      const expiresAt = this.cloudBilling?.session?.expires_at || 0
      return expiresAt ? `会话到期：${this.formatDate(expiresAt * 1000)}` : '会话信息待同步'
    },
    cloudAuthorizationText() {
      const authorization = this.cloudBilling?.authorization
      if (!authorization || !authorization.account_authorized || !authorization.labels?.length) {
        return '无内置授权'
      }
      return authorization.labels.join(' / ')
    },
    cloudAuthorizationDetailText() {
      const authorization = this.cloudBilling?.authorization
      if (!authorization) {
        return '未配置账号级授权'
      }
      const parts = []
      if (authorization.force_vip) {
        parts.push('含 VIP')
      }
      if (authorization.included_temp_access_seconds > 0) {
        parts.push(`附带 ${this.formatDurationSeconds(authorization.included_temp_access_seconds)}`)
      }
      if (authorization.overdraft_limit_seconds > 0) {
        parts.push(`透支 ${this.formatDurationSeconds(authorization.overdraft_limit_seconds)}`)
      }
      return parts.join(' · ') || '未配置账号级授权'
    },
    cloudTempAccessText() {
      const access = this.cloudBilling?.access
      if (!access) {
        return '0 秒'
      }
      if (access.overdraft_in_use) {
        return `已透支 ${this.formatDurationSeconds(Math.abs(access.effective_temp_access_seconds))}`
      }
      return this.formatDurationSeconds(access.effective_temp_access_seconds || 0)
    },
    cloudSettlementText() {
      const access = this.cloudBilling?.access
      if (!access) {
        return '每日 0 点结算'
      }
      const pending = access.pending_temp_access_seconds || 0
      const pendingText = `${pending >= 0 ? '+' : ''}${this.formatDurationSeconds(pending)}`
      const settlementAt = access.next_settlement_at ? this.formatDate(access.next_settlement_at * 1000) : '每日 0 点'
      return `待结算 ${pendingText} · ${settlementAt}`
    },
    cloudRewardText() {
      const access = this.cloudBilling?.access
      if (!access) {
        return '0 / 0 次'
      }
      return `${access.rewarded_ad_count_today || 0} / ${access.rewarded_ad_daily_limit || 0} 次`
    },
    cloudRewardDetailText() {
      const access = this.cloudBilling?.access
      if (!access) {
        return '观看激励广告可领取临时时长'
      }
      return `今日到账 ${this.formatDurationSeconds(access.rewarded_ad_seconds_today || 0)}`
    },
    recentCloudOrders() {
      return (this.cloudBilling.orders || []).slice(0, 3)
    },
    storageUsesDirectory() {
      return this.storageBackendKind === 'local-directory'
    },
    storageBackendDescription() {
      return this.storageBackendOptions.find((item) => item.value === this.storageBackendKind)?.description || ''
    },
    activeStorageLabel() {
      return this.storageBackendOptions.find((item) => item.value === this.activeStorageBackendKind)?.label || '未知'
    },
    explorerProviderKind() {
      var p = getPreset(this.activeStorageBackendKind)
      return p ? p.providerKind : ''
    },
    activeExplorerProvider() {
      return this.explorerPath === '/temp' ? this.tempProvider : this.historyProvider
    },
    activeExplorerProviderLabel() {
      if (this.explorerPath === '/temp') {
        return this.activeStorageLabel + ' / 临时缓存'
      }
      if (this.explorerPath === '/history') {
        return this.activeStorageLabel + ' / 历史录音'
      }
      return this.activeStorageLabel
    },
    hasExplorerFileProvider() {
      if (this.explorerPath === '/') {
        return true
      }
      return !!asFile(this.activeExplorerProvider)
    },
    activeProviderCaps() {
      if (this.historyProvider && this.historyProvider.meta && this.historyProvider.meta.capabilities) {
        return this.historyProvider.meta.capabilities
      }
      return {}
    },
    activeQueueProvider() {
      return this.activeQueueId === 'temp' ? this.tempProvider : this.historyProvider
    },
    activeQueueProviderLabel() {
      if (this.activeQueueId === 'temp') {
        return this.activeStorageLabel + ' / 临时缓存'
      }
      return this.activeStorageLabel + ' / 历史录音'
    },
    activeQueueProviderKind() {
      return this.activeQueueProvider ? this.activeQueueProvider.kind : ''
    },
    activeQueueProviderReady() {
      return this.activeQueueProvider ? this.activeQueueProvider.isReady() : false
    },
    activeQueueProviderCaps() {
      if (this.activeQueueProvider && this.activeQueueProvider.meta && this.activeQueueProvider.meta.capabilities) {
        return this.activeQueueProvider.meta.capabilities
      }
      return {}
    },
    queueListForInspector() {
      return [
        { id: 'temp', label: '临时缓存 (temp-cache)', active: this.nowState === 'recording' || this.nowState === 'paused' },
        { id: 'history', label: '历史录音 (history-blobs)', active: true },
      ]
    },
  },
  async mounted() {
    await this.bootstrap()
  },
  methods: {
    filesize,
    formatDate(value) {
      return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
    },
    secondToTime(value) {
      return dayjs(0).second(value).subtract(8, 'hours').format('HH:mm:ss')
    },
    formatDurationSeconds(value) {
      const total = Math.abs(Math.round(Number(value) || 0))
      const sign = Number(value) < 0 ? '-' : ''
      const hours = Math.floor(total / 3600)
      const minutes = Math.floor((total % 3600) / 60)
      const seconds = total % 60
      if (hours > 0) {
        return `${sign}${hours}小时${minutes}分`
      }
      if (minutes > 0) {
        return `${sign}${minutes}分${seconds ? `${seconds}秒` : ''}`
      }
      return `${sign}${seconds}秒`
    },
    applyCloudSummary(summary) {
      if (!summary) {
        this.cloudSession = null
        this.cloudBilling = createDefaultCloudBilling()
        return
      }
      this.cloudSession = summary.user || null
      this.cloudBilling = {
        ...createDefaultCloudBilling(),
        ...summary,
        orders: Array.isArray(summary.orders) ? summary.orders : (this.cloudBilling?.orders || []),
        session: {
          ...createDefaultCloudBilling().session,
          ...(summary.session || {}),
        },
        authorization: {
          ...createDefaultCloudBilling().authorization,
          ...(summary.authorization || {}),
        },
        access: {
          ...createDefaultCloudBilling().access,
          ...(summary.access || {}),
        },
      }
    },
    async playRewardedCloudAd() {
      const manager = getAdManager()
      const providerName = getPreferredProvider()
      const provider = manager.getProvider(providerName)
      if (!provider || !provider.isInitialized()) {
        throw new Error('当前没有可用的激励广告提供者')
      }

      const slotId = `cloud-reward-${Date.now()}`
      const slot = manager.createSlot(providerName, {
        slotId,
        format: 'rewarded',
        extras: {
          purpose: 'cloud_temp_access',
        },
      })

      let rewarded = false
      slot.on((event) => {
        if (event.type === 'reward') {
          rewarded = true
        }
      })

      try {
        await slot.load()
        if (typeof slot.show !== 'function') {
          throw new Error(`当前广告平台 ${providerName} 不支持激励广告`) 
        }
        await slot.show()
      } finally {
        slot.destroy()
      }

      if (!rewarded) {
        throw new Error('本次广告未触发奖励，请完整观看后重试')
      }

      return {
        provider: providerName,
        slotId,
      }
    },
    refreshStorageOptions() {
      this.storageBackendOptions = getAvailablePresets().map((p) => ({ value: p.name, label: p.label, description: p.description }))
      if (!this.storageBackendOptions.some((item) => item.value === this.storageBackendKind)) {
        this.storageBackendKind = normalizePresetName(this.storageBackendKind)
      }
    },
    async refreshCloudSession(options = {}) {
      const { autoSelect = false, switchBackend = false, silent = false } = options
      if (!hasCloudToken()) {
        this.applyCloudSummary(null)
        this.refreshStorageOptions()
        return false
      }

      try {
        const summary = await cloudBillingSummary()
        this.applyCloudSummary(summary)
        this.refreshStorageOptions()
        if (autoSelect) {
          this.storageBackendKind = 'cloud'
          store.set(storagePreferenceKey, 'cloud')
        }
        if (switchBackend) {
          await this.switchToCloudBackend({ silent: true })
        }
        return true
      } catch (error) {
        clearCloudSession()
        this.applyCloudSummary(null)
        this.refreshStorageOptions()
        if (!silent) {
          this.$message.error('云账号状态校验失败：' + (error.message || error))
        }
        return false
      }
    },
    async applyCloudApiBase() {
      this.cloudApiBaseUrl = setCloudApiBaseUrl(this.cloudApiBaseUrl)
      this.refreshStorageOptions()
      if (this.cloudLoggedIn) {
        await this.refreshCloudSession({ silent: false })
      }
      this.$message.success('云服务地址已更新')
    },
    async registerCloud() {
      if (!this.cloudForm.username || !this.cloudForm.password) {
        this.$message.warning('请输入用户名和密码')
        return
      }
      try {
        this.cloudActionLoading = true
        const session = await cloudRegister(this.cloudForm.username, this.cloudForm.password)
        this.cloudSession = session.user
        this.cloudForm.password = ''
        await this.refreshCloudSession({ autoSelect: true, switchBackend: true, silent: true })
        this.$message.success('云账号已注册并登录，已开放云后端')
      } catch (error) {
        this.$message.error('注册失败：' + (error.message || error))
      } finally {
        this.cloudActionLoading = false
      }
    },
    async loginCloud() {
      if (!this.cloudForm.username || !this.cloudForm.password) {
        this.$message.warning('请输入用户名和密码')
        return
      }
      try {
        this.cloudActionLoading = true
        const session = await cloudLogin(this.cloudForm.username, this.cloudForm.password)
        this.cloudSession = session.user
        this.cloudForm.password = ''
        await this.refreshCloudSession({ autoSelect: true, switchBackend: true, silent: true })
        this.$message.success('云账号登录成功，云后端已就绪')
      } catch (error) {
        this.$message.error('登录失败：' + (error.message || error))
      } finally {
        this.cloudActionLoading = false
      }
    },
    async logoutCloud() {
      try {
        this.cloudActionLoading = true
        await cloudLogout()
        this.applyCloudSummary(null)
        this.refreshStorageOptions()
        if (this.cloudBackendActive || this.storageBackendKind === 'cloud') {
          this.storageBackendKind = getDefaultPresetName()
          store.set(storagePreferenceKey, this.storageBackendKind)
          await this.handleStorageBackendChange()
        }
        this.$message.success('已退出云账号')
      } catch (error) {
        this.$message.error('退出登录失败：' + (error.message || error))
      } finally {
        this.cloudActionLoading = false
      }
    },
    getCloudPaymentCode(order) {
      return order?.payment_payload?.code_url || order?.payment_payload?.qr_code || ''
    },
    async openCloudPaymentWindow(order) {
      const checkoutUrl = order?.checkout_url
      const paymentCode = this.getCloudPaymentCode(order)
      if (checkoutUrl && /^https?:/i.test(checkoutUrl)) {
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
        return
      }
      if (!paymentCode) {
        return
      }

      const QRCode = await import('qrcode')
      const dataUrl = await QRCode.toDataURL(paymentCode, {
        width: 300,
        margin: 2,
      })
      const popup = window.open('', '_blank', 'noopener,noreferrer,width=420,height=560')
      if (!popup) {
        throw new Error('浏览器阻止了支付二维码窗口，请允许弹窗后重试')
      }
      popup.document.write(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${order.provider_label} 支付二维码</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #f6f8fb; color: #0f172a; }
    .card { max-width: 360px; margin: 0 auto; background: white; border-radius: 20px; padding: 24px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12); text-align: center; }
    img { width: 300px; height: 300px; border-radius: 16px; background: white; }
    code { display: block; margin-top: 12px; font-size: 12px; line-height: 1.5; color: #475569; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <h2>${order.provider_label} 扫码支付</h2>
    <p>金额：¥${(order.amount_cents / 100).toFixed(2)}</p>
    <img src="${dataUrl}" alt="支付二维码" />
    <code>${paymentCode}</code>
  </div>
</body>
</html>`)
      popup.document.close()
    },
    async createCloudRecharge(provider) {
      if (!this.cloudLoggedIn) {
        this.$message.warning('请先登录云账号')
        return
      }
      const res = await this.$prompt('输入充值金额（元）', provider === 'wechat' ? '微信充值' : '支付宝充值', { inputValue: '9.90' })
      if (res.action !== 'confirm' || !res.value) {
        return
      }
      const amountCents = Math.round(Number(res.value) * 100)
      if (!amountCents || amountCents < 100) {
        this.$message.error('充值金额至少为 1 元')
        return
      }

      try {
        this.cloudActionLoading = true
        const created = await cloudCreateRechargeOrder(provider, amountCents)
        await this.openCloudPaymentWindow(created.order)
        const hint = created.order?.status_message || `${created.order.provider_label} 订单已创建，请完成支付后再查询状态。`
        const confirm = await this.$confirm(`${hint}\n金额：¥${(amountCents / 100).toFixed(2)}\n\n支付完成后点击“确认”查询真实支付结果。`)
        if (confirm === 'confirm') {
          const result = await cloudConfirmRechargeOrder(created.order.id)
          await this.refreshCloudSession({ silent: true })
          if (result.order && result.order.status === 'paid') {
            this.$message.success(`${created.order.provider_label} 充值成功，余额已更新`)
          } else {
            this.$message.warning(result.order?.status_message || '支付尚未完成，请稍后重试确认')
          }
        } else {
          await this.refreshCloudSession({ silent: true })
          this.$message.info('订单已创建，可稍后继续确认支付状态')
        }
      } catch (error) {
        this.$message.error('创建充值订单失败：' + (error.message || error))
      } finally {
        this.cloudActionLoading = false
      }
    },
    async activateCloudVip() {
      if (!this.cloudLoggedIn) {
        this.$message.warning('请先登录云账号')
        return
      }
      try {
        this.cloudActionLoading = true
        const result = await cloudActivateVip()
        this.applyCloudSummary(result)
        this.$message.success(result.message || 'VIP 已激活')
      } catch (error) {
        this.$message.error('开通 VIP 失败：' + (error.message || error))
      } finally {
        this.cloudActionLoading = false
      }
    },
    async redeemCloudVipKey() {
      if (!this.cloudLoggedIn) {
        this.$message.warning('请先登录云账号')
        return
      }
      const result = await this.$prompt('请输入 VIP / 授权密钥', '密钥开通', { inputValue: '' })
      if (result.action !== 'confirm' || !result.value) {
        return
      }

      try {
        this.cloudActionLoading = true
        const summary = await cloudRedeemVipKey(result.value)
        this.applyCloudSummary(summary)
        this.$message.success(summary.message || '密钥已兑换')
      } catch (error) {
        this.$message.error('密钥兑换失败：' + (error.message || error))
      } finally {
        this.cloudActionLoading = false
      }
    },
    async watchRewardedCloudAd() {
      if (!this.cloudLoggedIn) {
        this.$message.warning('请先登录云账号')
        return
      }
      if ((this.cloudBilling?.access?.rewarded_ad_count_today || 0) >= (this.cloudBilling?.access?.rewarded_ad_daily_limit || Infinity)) {
        this.$message.warning('今日广告奖励次数已用完，请明天再试')
        return
      }

      try {
        this.cloudActionLoading = true
        const reward = await this.playRewardedCloudAd()
        const summary = await cloudClaimAdReward(reward.provider, reward.slotId)
        this.applyCloudSummary(summary)
        this.$message.success(summary.message || '广告奖励已到账')
      } catch (error) {
        this.$message.error('领取广告奖励失败：' + (error.message || error))
      } finally {
        this.cloudActionLoading = false
      }
    },
    async switchToCloudBackend(options = {}) {
      const { silent = false } = options
      if (!this.cloudLoggedIn) {
        throw new Error('请先登录云账号')
      }
      this.refreshStorageOptions()
      if (!this.cloudAvailable) {
        throw new Error('当前尚未检测到可用的云 token')
      }
      this.storageBackendKind = 'cloud'
      store.set(storagePreferenceKey, 'cloud')
      if (this.activeStorageBackendKind !== 'cloud' || !this.storageReady) {
        await this.handleStorageBackendChange()
      }
      await this.hydrateHistoryMetadataFromProvider()
      await this.syncHistoryItems()
      if (!silent) {
        this.$message.success('已切换到云后端')
      }
    },
    isInternalHistoryFile(filename) {
      return filename === historyMetaFile
    },
    async hydrateHistoryMetadataFromProvider() {
      const fp = asFile(this.historyProvider)
      if (!fp) {
        return
      }
      try {
        const has = await fp.hasFile(historyMetaFile)
        if (!has) {
          return
        }
        const blob = await fp.getFileBlob(historyMetaFile)
        const text = await blob.text()
        const payload = JSON.parse(text)
        if (Array.isArray(payload.ids) && payload.infoMap && typeof payload.infoMap === 'object') {
          this.historyBlobsIdx = payload.ids
          this.historyInfoMap = payload.infoMap
          store.set(historyKey, this.historyBlobsIdx)
          store.set(infoMap, this.historyInfoMap)
        }
      } catch (error) {
        console.warn('[history-meta] hydrate failed:', error)
      }
    },
    async persistHistoryMetadataToProvider() {
      const fp = asFile(this.historyProvider)
      if (!fp) {
        return
      }
      try {
        const blob = new Blob([
          JSON.stringify({
            ids: this.historyBlobsIdx,
            infoMap: this.historyInfoMap,
            updatedAt: Date.now(),
          }, null, 2),
        ], { type: 'application/json' })
        await this.set(historyMetaFile, blob)
      } catch (error) {
        console.warn('[history-meta] persist failed:', error)
      }
    },
    providerKindText(kind) {
      var map = {
        queue: '队列提供者',
        file: '文件提供者',
        hybrid: '文件 + 队列',
      }
      return map[kind] || '基础模式'
    },
    async createProviderPair() {
      const tempProvider = await createProviderFromPreset(
        this.storageBackendKind,
        { name: 'temp-cache', subdirectories: ['recorder', 'temp-cache'] },
      )
      const historyProvider = await createProviderFromPreset(
        this.storageBackendKind,
        { name: 'history-blobs', subdirectories: ['recorder', 'history-blobs'], directoryHandleKey: directoryHandleMemoryKey },
      )
      return { tempProvider, historyProvider }
    },
    async migrateProviderQueues(srcQueue, dstQueue) {
      if (!srcQueue || !dstQueue) return
      const chunks = await srcQueue.getAllChunks().catch(() => [])
      for (const chunk of chunks) {
        await dstQueue.push(chunk)
      }
    },
    async initializeStorageBackends({ migrate = false, previousTemp = null, previousHistory = null } = {}) {
      try {
        const pair = await this.createProviderPair()
        if (migrate && previousTemp) {
          const srcQ = asQueue(previousTemp)
          const dstQ = asQueue(pair.tempProvider)
          if (srcQ && dstQ) await this.migrateProviderQueues(srcQ, dstQ)
        }
        if (migrate && previousHistory) {
          const srcQ = asQueue(previousHistory)
          const dstQ = asQueue(pair.historyProvider)
          if (srcQ && dstQ) await this.migrateProviderQueues(srcQ, dstQ)
        }

        this.tempProvider = pair.tempProvider
        this.historyProvider = pair.historyProvider
        this.storageReady = true
        this.activeStorageBackendKind = this.storageBackendKind

        const presetInfo = getPreset(this.storageBackendKind)
        this.storageStatusMessage = presetInfo?.description ?? ''
        this.directoryBound = this.storageBackendKind === 'local-directory'
      } catch (error) {
        // 降级到 default
        const fallback = await createProviderFromPreset('default', { name: 'recording-fallback' })
        this.tempProvider = fallback
        this.historyProvider = await createProviderFromPreset('default', { name: 'history-fallback' })
        this.storageReady = true
        this.activeStorageBackendKind = 'default'
        this.directoryBound = false
        this.storageStatusMessage = '首选后端不可用，已自动回退到 IndexedDB。'
      }
    },
    async handleStorageBackendChange() {
      const previousTemp = this.tempProvider
      const previousHistory = this.historyProvider

      try {
        this.loading = true
        this.refreshStorageOptions()
        store.set(storagePreferenceKey, this.storageBackendKind)
        await this.initializeStorageBackends({ previousTemp, previousHistory, migrate: true })
        await this.hydrateHistoryMetadataFromProvider()
        await this.syncHistoryItems()
        this.$message.success(`已切换到 ${this.activeStorageLabel}`)
      } catch (error) {
        this.$message.error('切换存储后端失败：' + error)
      } finally {
        this.loading = false
      }
    },

    // ———— Storage Explorer ————
    openStorageExplorer() {
      this.showStorageExplorer = true
      this.explorerPath = '/'
      this.loadExplorerFiles()
      this.loadQueueChunks()
    },
    getExplorerTargetProvider(path) {
      var targetPath = path || this.explorerPath
      return targetPath === '/temp' ? this.tempProvider : this.historyProvider
    },
    async loadExplorerFiles() {
      this.explorerLoading = true
      this.explorerFiles = []
      try {
        if (this.explorerPath === '/') {
          this.explorerFiles = [
            {
              name: '历史录音',
              path: '/history',
              isFolder: true,
              typeLabel: this.historyProvider ? this.providerKindText(this.historyProvider.kind) : '未就绪',
            },
            {
              name: '临时缓存',
              path: '/temp',
              isFolder: true,
              typeLabel: this.tempProvider ? this.providerKindText(this.tempProvider.kind) : '未就绪',
            },
          ]
          return
        }
        var provider = this.getExplorerTargetProvider()
        var fp = asFile(provider)
        if (!fp) {
          return
        }
        var files = await fp.listFiles()
        var items = []
        for (var j = 0; j < files.length; j++) {
          var fname = files[j]
          if (this.explorerPath === '/history' && this.isInternalHistoryFile(fname)) {
            continue
          }
          var sz = 0
          try { sz = await fp.getFileSize(fname) } catch (e) { /* ignore */ }
          var historyId = ''
          var displayName = fname
          if (this.explorerPath === '/history') {
            historyId = parseHistoryFileId(fname)
            if (this.historyInfoMap[historyId] && this.historyInfoMap[historyId].name) {
              displayName = this.historyInfoMap[historyId].name
            }
          }
          var ext = fname.split('.').pop().toLowerCase()
          var typeMap = {
            webm: '音频文件', mp3: '音频文件', ogg: '音频文件', wav: '音频文件',
            mp4: '视频文件', mkv: '视频文件',
            json: 'JSON 文件', txt: '文本文件',
          }
          var recordInfo = historyId ? this.historyInfoMap[historyId] : null
          items.push({
            name: displayName,
            providerKey: fname,
            historyId: historyId,
            size: sz,
            sizeLabel: sz > 0 ? filesize(sz) : '0',
            isFolder: false,
            typeLabel: recordInfo
              ? (recordInfo.recordType === 'video' ? '历史视频' : '历史音频')
              : (typeMap[ext] || '文件'),
          })
        }
        this.explorerFiles = items
      } catch (err) {
        console.error('[StorageExplorer] loadFiles error:', err)
        this.$message.error('加载文件列表失败')
      } finally {
        this.explorerLoading = false
      }
    },
    handleExplorerNavigate(path) {
      this.explorerPath = path
      this.loadExplorerFiles()
    },
    async handleExplorerSwitchBackend(value) {
      this.storageBackendKind = value
      await this.handleStorageBackendChange()
      this.explorerPath = '/'
      this.loadExplorerFiles()
      this.loadQueueChunks()
    },
    async handleExplorerDownload(item) {
      if (item.historyId) {
        await this.playlist_download(item.historyId)
        return
      }
      var provider = this.getExplorerTargetProvider()
      var fp = asFile(provider)
      var fileKey = item.providerKey || item.name
      if (fp) {
        try {
          await streamingDownloadFile(item.name || fileKey, fp, fileKey)
          return
        } catch (e) {
          console.warn('[Explorer] streamingDownload failed, fallback:', e)
        }
      }
      // Fallback: blob
      if (fp) {
        var blob = await fp.getFileBlob(fileKey)
        var url = URL.createObjectURL(blob)
        var a = document.createElement('a')
        a.href = url
        a.download = item.name || fileKey
        a.click()
        URL.revokeObjectURL(url)
      }
    },
    async handleExplorerDelete(item) {
      const res = await this.$confirm('确定删除 "' + item.name + '"？')
      if (res !== 'confirm') return
      try {
        if (item.historyId) {
          if (this.nowRecordInfo && this.nowRecordInfo.id === item.historyId) {
            this.clearNow()
          }
          await this.removeItem(item.historyId)
          await this.syncHistoryItems()
        } else {
          var provider = this.getExplorerTargetProvider()
          var fp = asFile(provider)
          if (fp) {
            await fp.deleteFile(item.providerKey || item.name)
          }
        }
        this.loadExplorerFiles()
        this.$message.success('已删除')
      } catch (err) {
        this.$message.error('删除失败：' + (err.message || err))
      }
    },
    async handleExplorerOpen(item) {
      if (item.historyId) {
        await this.select(item.historyId)
        return
      }
      var provider = this.getExplorerTargetProvider()
      var fp = asFile(provider)
      if (!fp) {
        return
      }
      var blob = await fp.getFileBlob(item.providerKey || item.name)
      var url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      window.setTimeout(function () {
        URL.revokeObjectURL(url)
      }, 60000)
    },
    async loadQueueChunks() {
      this.queueLoading = true
      this.queueChunks = []
      this.queueChunkCount = 0
      this.queueTotalSize = 0
      try {
        var provider = this.activeQueueProvider
        var q = asQueue(provider)
        if (!q) {
          this.queueLoading = false
          return
        }
        var count = await q.count()
        this.queueChunkCount = count
        var chunks = []
        var totalSize = 0
        for (var i = 0; i < count; i++) {
          var chunk = await q.getChunk(i)
          var sz = chunk ? chunk.size : 0
          totalSize += sz
          chunks.push({
            size: sz,
            type: chunk ? (chunk.type || '') : '',
          })
        }
        this.queueChunks = chunks
        this.queueTotalSize = totalSize
      } catch (err) {
        console.error('[QueueInspector] loadChunks error:', err)
      } finally {
        this.queueLoading = false
      }
    },
    handleQueueSelect(id) {
      this.activeQueueId = id
      this.loadQueueChunks()
    },
    async bindLocalDirectory() {
      if (!this.supportsDirectoryAccess) {
        this.$message.error('当前浏览器不支持本地目录访问 API。')
        return
      }

      const previousTemp = this.tempProvider
      const previousHistory = this.historyProvider

      try {
        this.loading = true
        const dirProvider = await DirectoryFileProvider.requestDirectory({
          handleKey: directoryHandleMemoryKey,
        })
        await dirProvider.initialize()

        this.storageBackendKind = 'local-directory'
        store.set(storagePreferenceKey, this.storageBackendKind)
        await this.initializeStorageBackends({
          previousTemp,
          previousHistory,
          migrate: true,
        })
        await this.syncHistoryItems()
        this.$message.success('已绑定本地目录，并迁移当前录音数据。')
      } catch (error) {
        this.$message.warning('绑定本地目录未完成：' + error)
      } finally {
        this.loading = false
      }
    },
    async bootstrap() {
      try {
        this.loading = true
        this.refreshStorageOptions()
        await this.refreshCloudSession({ autoSelect: true, silent: true })
        await this.initializeStorageBackends()
        this.loadHistoryIdx()
        await this.hydrateHistoryMetadataFromProvider()
        await this.syncHistoryItems()

        if (await this.tempCacheExists()) {
          const info = await this.getTempRecordingInfo()
          if (info?.source) {
            this.selectMediaValue = info.source
          }
          await this.ensureRecorderReady(true)
          await this.startFromTempCache()
        }
      } catch (error) {
        this.$message.error('初始化失败：' + error)
      } finally {
        this.loading = false
      }
    },
    async ensureRecorderReady(force = false) {
      if (this.recorder && !force && this.recorder.state !== 'inactive') {
        return
      }
      await this.sourceSelect()
    },
    async sourceSelect() {
      const media = await getMedia(this.selectMediaValue)
      if (!media || !media.stream) {
        throw new Error('当前媒体源不可用')
      }
      await this.setSource(media)
    },
    async setSource(source) {
      if (!source || !source.stream) {
        throw new Error('媒体源无效')
      }

      this.recordingInfo.source = source.name

      if (source.type === 'video') {
        this.recordingInfo.recordType = 'video'
        await this.initVideoRecorder(source.stream)
      } else {
        this.recordingInfo.recordType = 'audio'
        await this.initRecorder(source.stream)
      }
    },
    async initVideoRecorder(stream) {
      const videoElement = this.$refs.record_video_player
      if (videoElement) {
        videoElement.srcObject = stream
        await videoElement.play().catch(() => undefined)
      }

      let bit = 1500000
      const res = await this.$prompt('输入总码率（单位 Mbps，推荐 1.5）', '视频录制参数', { inputValue: '1.5' })
      if (res.action === 'confirm' && res.value) {
        const parsed = Number(res.value)
        if (!Number.isNaN(parsed) && parsed > 0) {
          bit = parsed * 1000 * 1000
        }
      }

      const recorder = new MediaRecorder(stream, {
        bitsPerSecond: bit,
        audioBitrateMode: 'variable',
        mimeType: 'video/webm;codecs=vp9',
      })
      recorder.ondataavailable = (event) => this.dataavailable(event)
      this.recorder = recorder

      // 提取音频轨道用于波形可视化
      if (stream.getAudioTracks().length > 0) {
        this.setupAudioAnalyser(stream)
      }
    },
    async initRecorder(stream) {
      const mediaStream = stream || (await navigator.mediaDevices.getUserMedia({ audio: true, video: false }))
      let bit = 128000
      const res = await this.$prompt('输入音频码率（单位 kbps，推荐 128）', '音频录制参数', { inputValue: '128' })
      if (res.action === 'confirm' && res.value) {
        const parsed = Number(res.value)
        if (!Number.isNaN(parsed) && parsed > 0) {
          bit = parsed * 1000
        }
      }

      const recorder = new MediaRecorder(mediaStream, {
        bitsPerSecond: bit,
        audioBitrateMode: 'variable',
        mimeType: 'audio/webm;codecs=opus',
      })
      recorder.ondataavailable = (event) => this.dataavailable(event)
      this.recorder = recorder

      // 创建音频分析器用于波形可视化
      this.setupAudioAnalyser(mediaStream)
    },
    setupAudioAnalyser(stream) {
      this.teardownAudioAnalyser()
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (!AudioContext) return
        const ctx = new AudioContext()
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => undefined)
        }
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.8
        const source = ctx.createMediaStreamSource(stream)
        source.connect(analyser)
        // 不连接到 destination，避免回声
        this.audioContext = ctx
        this.analyserNode = analyser
      } catch (err) {
        console.warn('创建音频分析器失败:', err)
      }
    },
    teardownAudioAnalyser() {
      if (this.audioContext) {
        try { this.audioContext.close() } catch { /* ignore */ }
        this.audioContext = null
      }
      this.analyserNode = null
    },
    syncActivePoints(points) {
      const nextPoints = Array.isArray(points) ? points : []
      this.recordingInfo.points = nextPoints
      if (this.nowRecordInfo) {
        this.nowRecordInfo = {
          ...this.nowRecordInfo,
          points: nextPoints,
        }
        if (this.nowRecordInfo.id && this.historyInfoMap[this.nowRecordInfo.id]) {
          this.historyInfoMap = {
            ...this.historyInfoMap,
            [this.nowRecordInfo.id]: this.nowRecordInfo,
          }
          store.set(infoMap, this.historyInfoMap)
          this.persistHistoryMetadataToProvider().catch((error) => {
            console.warn('[history-meta] syncActivePoints failed:', error)
          })
        }
      }
    },
    loadPointIntoEditor(index) {
      const point = this.activePoints[index] || {}
      this.editingPointIndex = index
      this.nowShowedNote = point
      this.showPlayer = false
      if (point && point.note && typeof point.note === 'object') {
        this.nowEditNote = {
          title: point.note.title || '',
          content: point.note.content || '',
        }
      } else {
        this.clearNowEditNote()
      }
      this.isShowingNote = false
      this.isNoteEditing = true
    },
    createPoint(type, note = null) {
      return {
        type,
        note,
        position: this.nowRecordInfo?.length || this.chunkCount,
        time: new Date(),
      }
    },
    addPoint(note = null) {
      this.syncActivePoints([...this.activePoints, this.createPoint('point', note)])
    },
    addNote() {
      this.editingPointIndex = -1
      this.clearNowEditNote()
      this.isNoteEditing = true
    },
    clearNowEditNote() {
      this.nowEditNote = {
        title: '',
        content: '',
      }
    },
    note_confirm() {
      const note = {
        title: this.nowEditNote.title,
        desc: this.nowEditNote.title,
        content: this.nowEditNote.content,
      }
      const points = [...this.activePoints]
      if (this.editingPointIndex >= 0 && this.editingPointIndex < points.length) {
        // 编辑已有记录点
        const point = points[this.editingPointIndex]
        point.note = note
        this.$set(points, this.editingPointIndex, { ...point })
        this.syncActivePoints(points)
      } else {
        // 新增记录点
        this.addPoint(note)
      }
      this.isNoteEditing = false
      this.editingPointIndex = -1
      this.clearNowEditNote()
    },
    async note_cancel() {
      if (this.nowEditNote.title || this.nowEditNote.content) {
        const res = await this.$confirm('不保存当前笔记吗？')
        if (res !== 'confirm') {
          return
        }
      }
      this.isNoteEditing = false
      this.editingPointIndex = -1
      this.clearNowEditNote()
    },
    showRecordingPoint(index) {
      this.loadPointIntoEditor(index)
    },
    startEditPoint() {
      if (this.editingPointIndex >= 0) {
        this.loadPointIntoEditor(this.editingPointIndex)
      }
    },
    show_player() {
      this.showPlayer = true
    },
    play() {
      if (!this.src) {
        return
      }
      this.showPlayer = true
      this.$nextTick(() => {
        const player = this.$refs.player
        player && player.play && player.play().catch(() => undefined)
      })
    },
    async start() {
      if (!this.storageReady) {
        this.$message.error('当前存储后端未就绪，请先确认存储配置。')
        return
      }

      try {
        this.loading = true
        this.clearNow()
        await this.ensureRecorderReady()
        this.startTime = new Date()
        this.endTime = new Date()
        this.recordingInfo = {
          ...createEmptyRecordingInfo(),
          source: this.selectMediaValue,
          recordType: this.recordingInfo.recordType,
        }
        this.recorder.start(1000)
        this.stateSwitch('recording')
        await this.storeRecording()
      } catch (error) {
        this.$message.error('开始录制失败：' + error)
      } finally {
        this.loading = false
      }
    },
    async resume() {
      if (!this.storageReady) {
        this.$message.error('当前存储后端未就绪。')
        return
      }
      await this.ensureRecorderReady()
      this.recorder.resume()
      this.stateSwitch('recording')
    },
    pause() {
      if (!this.recorder) {
        return
      }
      this.recorder.pause()
      this.stateSwitch('paused')
    },
    stop() {
      if (!this.recorder) {
        return
      }
      this.stopping = true
      this.recorder.stop()
      this.stop_after().finally(() => {
        this.stopping = false
      })
    },
    stateSwitch(state) {
      this.nowState = state
    },
    async dataavailable(event) {
      if (!event?.data || event.data.size === 0) {
        return
      }
      this.endTime = new Date()
      this.recordingInfo.size += event.data.size
      this.recordingInfo.alerady_saved = false
      await this.addRecordFrame(event.data)
      this.chunkCount++
      await this.storeRecording()
    },
    async addRecordFrame(frame) {
      // 保留内存副本，确保 merge 时数据可用（避免 OPFS 异步竞态）
      this.inMemoryChunks.push(frame)
      const q = asQueue(this.tempProvider)
      if (q) {
        try { await q.push(frame) } catch (e) { console.warn('[recorder] OPFS queue push failed, in-memory fallback active', e) }
      }
    },
    async storeRecording() {
      await store.set(recordingInfoKey, {
        startTime: this.startTime,
        endTime: this.endTime,
        ...this.recordingInfo,
      })
    },
    async getTempRecordingInfo() {
      return store.get(recordingInfoKey)
    },
    async tempCacheExists() {
      const q = asQueue(this.tempProvider)
      return q ? (await q.count()) > 0 : false
    },
    async clearTempCache() {
      this.inMemoryChunks = []
      const q = asQueue(this.tempProvider)
      if (q) {
        await q.clear()
      }
    },
    async loadTempCache() {
      const q = asQueue(this.tempProvider)
      if (!q) {
        return []
      }
      return await q.getAllChunks()
    },
    async startFromTempCache() {
      const q = asQueue(this.tempProvider)
      if (!q) throw new Error('缓存存储未初始化')
      const cnt = await q.count()
      if (cnt === 0) {
        throw new Error('不存在上次缓存')
      }
      const info = await this.getTempRecordingInfo()
      this.chunkCount = cnt
      this.recordingInfo = {
        ...createEmptyRecordingInfo(),
        ...(info || {}),
      }
      this.startTime = info?.startTime ? new Date(info.startTime) : new Date()
      this.endTime = info?.endTime ? new Date(info.endTime) : new Date()
      this.stateSwitch('paused')
    },
    async forceClear() {
      if (!this.recordingInfo.alerady_saved) {
        this.$message.warning('请先停止并保存，或者先执行紧急下载，再进行强制清空。')
        return
      }
      if (this.recorder && this.recorder.state !== 'inactive') {
        this.recorder.stop()
      }
      await this.clearTempCache()
      this.chunkCount = 0
      this.recordingInfo = createEmptyRecordingInfo()
      this.nowRecordInfo = null
      this.stateSwitch('normal')
      this.src = ''
    },
    async forceDownload() {
      if (this.nowState === 'recording') {
        this.$message.warning('请先暂停或停止录制，再进行紧急下载。')
        return
      }
      const writer = saver.createWriteStream('forcedownload.webm').getWriter()
      const progress = this.$message.info({ message: '紧急下载中…', duration: 0, showClose: true })
      if (this.inMemoryChunks.length > 0) {
        // 使用内存中的 chunks
        const total = this.inMemoryChunks.length
        for (let i = 0; i < total; i++) {
          const chunk = this.inMemoryChunks[i]
          const buf = chunk instanceof Blob ? new Uint8Array(await chunk.arrayBuffer()) : new Uint8Array(chunk)
          await writer.write(buf)
          progress.message = `紧急下载中… ${Math.round(((i + 1) / total) * 100)}%`
        }
      } else {
        // 回退：从 OPFS 队列读取
        const q = asQueue(this.tempProvider)
        if (!q) {
          this.$message.error('缓存存储未初始化。')
          return
        }
        const total = await q.count()
        for (let index = 0; index < total; index += 1) {
          const chunk = await q.getChunk(index)
          if (chunk) {
            const buf = chunk instanceof Blob ? new Uint8Array(await chunk.arrayBuffer()) : chunk
            await writer.write(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
          }
          progress.message = `紧急下载中… ${Math.round(((index + 1) / total) * 100)}%`
        }
      }
      await writer.close()
      progress.message = '紧急下载完成'
      this.recordingInfo.alerady_saved = true
      await this.storeRecording()
    },
    async stop_after() {
      await sleep(0)
      this.stateSwitch('merging')
      await this.mergeFromProvider()
      await this.pushToHistory()
      await this.clearTempCache()
      await this.syncHistoryItems()
      this.stateSwitch('stopped')
      const id = this.nowRecordInfo.id
      try {
        const res = await this.$prompt('请输入名称', '命名录音', { inputValue: this.nowRecordInfo.name })
        if (res.action === 'confirm' && res.value) {
          await this.renameItem(id, res.value)
          await this.syncHistoryItems()
        }
      } catch (error) {
        // ignore cancel
      }
      this.loadNow(id, await this.readHistoryItem(id))
    },
    async mergeFromProvider() {
      const mimeType = this.recordingInfo.recordType === 'video' ? 'video/webm' : 'audio/webm'
      if (this.inMemoryChunks.length > 0) {
        // 优先使用内存中的 chunks（最可靠）
        this.mergedBlob = new Blob(this.inMemoryChunks, { type: mimeType })
      } else {
        // 回退：从 OPFS 队列逐个读取
        const q = asQueue(this.tempProvider)
        if (!q) throw new Error('缓存存储不可用')
        const chunkCount = await q.count()
        const materializedParts = []
        for (let i = 0; i < chunkCount; i++) {
          const chunk = await q.getChunk(i)
          materializedParts.push(await chunk.arrayBuffer())
        }
        this.mergedBlob = new Blob(materializedParts, { type: mimeType })
      }
      this.src = URL.createObjectURL(this.mergedBlob)
      const id = `record_${dayjs(this.startTime).format('YYYY-MM-DD HH:mm:ss')}_${dayjs(this.endTime).format('YYYY-MM-DD HH:mm:ss')}`
      this.nowRecordInfo = {
        name: id,
        id,
        startTime: this.startTime,
        endTime: this.endTime,
        timeSpanList: [],
        length: this.chunkCount,
        ...this.recordingInfo,
      }
    },
    clearNow() {
      if (this.src) {
        URL.revokeObjectURL(this.src)
      }
      this.src = ''
      this.mergedBlob = null
      this.chunkCount = 0
      this.inMemoryChunks = []
      this.nowRecordInfo = null
      this.recordingInfo.points = []
      this.teardownAudioAnalyser()
    },
    loadNow(id, blob) {
      this.clearNow()
      this.mergedBlob = blob
      this.nowRecordInfo = this.historyInfoMap[id]
      this.src = URL.createObjectURL(blob)
    },
    async pushToHistory() {
      if (!this.mergedBlob || !this.nowRecordInfo?.id) {
        throw new Error('当前录音尚未完成，无法保存')
      }
      await this.addItem(this.nowRecordInfo, this.mergedBlob)
    },
    async addItem(info, blob) {
      if (!this.historyBlobsIdx.includes(info.id)) {
        this.historyBlobsIdx.push(info.id)
      }
      store.set(historyKey, this.historyBlobsIdx)
      this.historyInfoMap = {
        ...this.historyInfoMap,
        [info.id]: info,
      }
      store.set(infoMap, this.historyInfoMap)
      await this.set(historyFileKey(info.id), blob)
      await this.persistHistoryMetadataToProvider()
      if (this.nowRecordInfo && info.id === this.nowRecordInfo.id) {
        this.recordingInfo.alerady_saved = true
      }
    },
    loadHistoryIdx() {
      this.historyBlobsIdx = store.has(historyKey) ? store.get(historyKey) : []
      this.historyInfoMap = store.has(infoMap) ? store.get(infoMap) : {}
    },
    async syncHistoryItems() {
      this.historyItems = (
        await Promise.all(
          this.historyBlobsIdx.map(async (id) => {
            const info = this.historyInfoMap[id]
            if (!info) {
              return null
            }
            const blob = await this.readHistoryItem(id).catch(() => null)
            return {
              id,
              name: info.name,
              source: info.source,
              recordType: info.recordType || 'audio',
              startText: this.formatDate(info.startTime),
              lengthText: this.secondToTime(info.length || 0),
              sizeText: blob ? filesize(blob.size) : '未知',
            }
          })
        )
      ).filter(Boolean)
    },
    async readHistoryItem(id) {
      if (!this.historyBlobsIdx.includes(id)) {
        throw new Error(`记录 ${id} 不存在`)
      }
      var result = await this.get(historyFileKey(id))
      if (!result) {
        result = await this.get(legacyHistoryFileKey(id))
      }
      if (!result) {
        throw new Error(`记录 ${id} 的二进制数据不存在`)
      }
      return result
    },
    async select(id) {
      if (this.nowState === 'recording' || this.nowState === 'paused') {
        this.$message.error('请先停止当前录制，再切换历史录音。')
        return
      }
      const blob = await this.readHistoryItem(id)
      this.loadNow(id, blob)
      this.showPlayer = true
    },
    async playlist_download(id) {
      const info = this.historyInfoMap[id]
      if (!info) {
        return
      }
      this.$message.info(`已开始下载：${info.name}`)
      const fp = asFile(this.historyProvider)
      if (fp) {
        // 流式下载 — 不加载到 JS 堆
        var fileKey = await this.resolveHistoryFileKey(id)
        await streamingDownloadFile(`${info.name}.webm`, fp, fileKey)
      } else {
        // 降级：URL 方式
        const bloburl = URL.createObjectURL(await this.readHistoryItem(id))
        await this.downloadUrl(`${info.name}.webm`, bloburl)
        URL.revokeObjectURL(bloburl)
      }
      // JSON 信息文件很小，直接下载即可
      const infourl = URL.createObjectURL(new Blob([JSON.stringify(info, null, 2)]))
      await this.downloadUrl(`${info.name}.json`, infourl)
      URL.revokeObjectURL(infourl)
    },
    async playlist_del(id) {
      const info = this.historyInfoMap[id]
      if (!info) {
        return
      }
      const res = await this.$confirm(`是否删除：${info.name}？`)
      if (res !== 'confirm') {
        return
      }
      if (this.nowRecordInfo && this.nowRecordInfo.id === id) {
        this.clearNow()
      }
      await this.removeItem(id)
      await this.syncHistoryItems()
    },
    async playlist_rename(id) {
      const info = this.historyInfoMap[id]
      if (!info) {
        return
      }
      const res = await this.$prompt('请输入名称', '重命名录音', { inputValue: info.name })
      if (res.action === 'confirm' && res.value) {
        await this.renameItem(id, res.value)
        await this.syncHistoryItems()
      }
    },
    async removeNow() {
      if (this.nowRecordInfo) {
        await this.playlist_del(this.nowRecordInfo.id)
      }
    },
    async clear() {
      const res = await this.$confirm('确定要清除所有记录吗？')
      if (res === 'confirm') {
        await this.clearHistory()
      }
    },
    async clearHistory() {
      for (const id of this.historyBlobsIdx) {
        await this.removeHistoryBlobFile(id)
      }
      store.remove(historyKey)
      store.remove(infoMap)
      this.clearNow()
      this.loadHistoryIdx()
      await this.persistHistoryMetadataToProvider()
      await this.syncHistoryItems()
    },
    async renameItem(id, newName) {
      const current = this.historyInfoMap[id]
      if (!current) {
        return
      }
      if (!newName || newName === current.name) {
        return
      }
      const nextInfo = { ...current, name: newName }
      this.historyInfoMap = {
        ...this.historyInfoMap,
        [id]: nextInfo,
      }
      store.set(infoMap, this.historyInfoMap)
      if (this.nowRecordInfo && this.nowRecordInfo.id === id) {
        this.nowRecordInfo = {
          ...this.nowRecordInfo,
          name: newName,
        }
      }
      await this.persistHistoryMetadataToProvider()
    },
    async removeItem(id) {
      this.historyBlobsIdx = this.historyBlobsIdx.filter((item) => item !== id)
      const nextInfoMap = { ...this.historyInfoMap }
      delete nextInfoMap[id]
      this.historyInfoMap = nextInfoMap
      store.set(historyKey, this.historyBlobsIdx)
      store.set(infoMap, this.historyInfoMap)
      await this.removeHistoryBlobFile(id)
      await this.persistHistoryMetadataToProvider()
    },
    async download() {
      if (!this.nowRecordInfo) {
        return
      }
      this.$message.info(`已开始下载：${this.nowRecordInfo.name}`)
      // 优先流式下载：如果已保存到 history，从 Provider 流式下载
      const fp = asFile(this.historyProvider)
      const fk = await this.resolveHistoryFileKey(this.nowRecordInfo.id)
      if (fp && this.recordingInfo.alerady_saved) {
        try {
          const has = await fp.hasFile(fk)
          if (has) {
            await streamingDownloadFile(`${this.nowRecordInfo.name}.webm`, fp, fk)
            const infourl = URL.createObjectURL(new Blob([JSON.stringify(this.nowRecordInfo, null, 2)]))
            await this.downloadUrl(`${this.nowRecordInfo.name}.json`, infourl)
            URL.revokeObjectURL(infourl)
            return
          }
        } catch (err) {
          console.warn('流式下载失败，降级为 URL 下载', err)
        }
      }
      // 降级：使用内存中的 blob URL
      if (this.src) {
        await this.downloadUrl(`${this.nowRecordInfo.name}.webm`, this.src)
        const infourl = URL.createObjectURL(new Blob([JSON.stringify(this.nowRecordInfo, null, 2)]))
        await this.downloadUrl(`${this.nowRecordInfo.name}.json`, infourl)
        URL.revokeObjectURL(infourl)
      }
    },
    async downloadAll() {
      const toast = this.$message.warning({ message: '正在顺序下载所有录音…', duration: 0, showClose: true })
      for (const id of this.historyBlobsIdx) {
        await this.playlist_download(id)
      }
      toast.message = '全部下载完成'
      toast.close()
    },
    async downloadAll_packed() {
      const fp = asFile(this.historyProvider)
      if (!fp) {
        this.$message.error('存储 Provider 不可用，无法打包下载')
        return
      }

      const packToast = this.$message.warning({ message: '正在流式打包……', duration: 0, showClose: true })

      const items = []
      for (const id of this.historyBlobsIdx) {
        const info = this.historyInfoMap[id]
        if (!info) continue
        items.push({
          folder: id,
          fileKey: await this.resolveHistoryFileKey(id),
          webmName: `${id}.webm`,
          infoJson: JSON.stringify(info, null, 2),
        })
      }

      try {
        await streamingZipDownload(
          items,
          'packageRecords.zip',
          fp,
          (percent, currentFile) => {
            packToast.message = `打包中 ${percent}%：${currentFile || ''}`
          },
        )
        packToast.close()
        this.$message.success('打包下载完成')
      } catch (err) {
        packToast.close()
        this.$message.error('打包下载失败：' + (err.message || err))
      }
    },
    async downloadUrl(name, url) {
      const downloader = new downloadjs({
        url,
        filename: name,
      })
      await downloader
    },
    async get(key) {
      const f = asFile(this.historyProvider)
      if (!f) return null
      try {
        return await f.getFileBlob(key)
      } catch {
        return null
      }
    },
    async set(key, value) {
      const f = asFile(this.historyProvider)
      if (!f) throw new Error('历史存储未初始化')
      if (await f.hasFile(key)) {
        await f.deleteFile(key)
      }
      await f.appendToFile(key, value)
    },
    async del(key) {
      const f = asFile(this.historyProvider)
      if (!f) return
      if (await f.hasFile(key)) {
        await f.deleteFile(key)
      }
    },
    async resolveHistoryFileKey(id) {
      const preferred = historyFileKey(id)
      const legacy = legacyHistoryFileKey(id)
      const f = asFile(this.historyProvider)
      if (!f) {
        return preferred
      }
      if (await f.hasFile(preferred)) {
        return preferred
      }
      if (await f.hasFile(legacy)) {
        return legacy
      }
      return preferred
    },
    async removeHistoryBlobFile(id) {
      await this.del(historyFileKey(id))
      await this.del(legacyHistoryFileKey(id))
    },
  },
}
</script>
