<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import config from '../config.js'
import { fetchList } from '../api/client.js'
import IconBase from './IconBase.vue'

const meta = config.vault || {}

const path = ref('/')
const data = ref(null)
const loading = ref(true)
const error = ref(null)
const q = ref('')
const sortBy = ref('default') // default | name | size | date
const viewMode = ref('grid') // grid | list
const inspected = ref(null)
const copiedPath = ref(false)
const searchRef = ref(null)

let requestId = 0
let copyTimer = null

const KIND_ICON = {
  doc: 'file-text',
  image: 'image',
  video: 'film',
  audio: 'music',
  archive: 'archive',
  code: 'code',
  other: 'file'
}

async function load(p) {
  const id = ++requestId
  loading.value = true
  error.value = null
  inspected.value = null
  try {
    const result = await fetchList(p)
    if (id !== requestId) return
    data.value = result
    path.value = p
  } catch (e) {
    if (id !== requestId) return
    error.value = e?.message || '读取失败'
  } finally {
    if (id === requestId) loading.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    if (inspected.value) {
      inspected.value = null
    } else if (document.activeElement === searchRef.value) {
      q.value = ''
      searchRef.value?.blur()
    }
    return
  }
  if (e.key === '/' && document.activeElement !== searchRef.value) {
    const tag = e.target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    e.preventDefault()
    searchRef.value?.focus()
  }
}

onMounted(() => {
  load('/')
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  requestId += 1
  clearTimeout(copyTimer)
  window.removeEventListener('keydown', onKeydown)
})

const crumbs = computed(() => {
  const parts = path.value.split('/').filter(Boolean)
  const acc = []
  let cur = ''
  parts.forEach((p) => {
    cur += '/' + p
    acc.push({ name: p, path: cur })
  })
  return acc
})

function goUp() {
  if (path.value === '/') return
  const parts = path.value.split('/').filter(Boolean)
  parts.pop()
  load(parts.length ? '/' + parts.join('/') : '/')
}

const usage = computed(() => data.value?.usage || { used: 0, total: 1 })
const usedPct = computed(() => Math.min(100, Math.round((usage.value.used / usage.value.total) * 100)))
const TICKS = 20
const SEGMENTS = 40
const litSegments = computed(() => Math.round((usedPct.value / 100) * SEGMENTS))

const rawEntries = computed(() => data.value?.entries || [])

const entries = computed(() => {
  const s = q.value.trim().toLowerCase()
  let list = s
    ? rawEntries.value.filter((e) =>
        `${e.name} ${e.kind || ''} ${e.type}`.toLowerCase().includes(s)
      )
    : [...rawEntries.value]

  if (sortBy.value !== 'default') {
    list.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      if (sortBy.value === 'name') return a.name.localeCompare(b.name, 'zh-CN')
      if (sortBy.value === 'size') return (b.size || 0) - (a.size || 0)
      if (sortBy.value === 'date') return String(b.modified || '').localeCompare(String(a.modified || ''))
      return 0
    })
  }
  return list
})

const folderCount = computed(() => entries.value.filter((e) => e.type === 'folder').length)
const fileCount = computed(() => entries.value.filter((e) => e.type === 'file').length)

function sizeFmt(kb) {
  if (!kb) return '——'
  if (kb < 1024) return `${kb} KB`
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${(kb / 1024 / 1024).toFixed(2)} GB`
}

function fullPath(name) {
  return path.value === '/' ? `/${name}` : `${path.value}/${name}`
}

function openEntry(e) {
  if (e.type === 'folder') {
    load(fullPath(e.name))
  } else {
    inspected.value = { ...e, fullPath: fullPath(e.name) }
    copiedPath.value = false
  }
}

function downloadFile(e) {
  if (!e?.downloadUrl) return
  const url = new URL(e.downloadUrl, location.href)
  if (['http:', 'https:'].includes(url.protocol)) window.open(url.href, '_blank', 'noopener')
}

async function copyFilePath(fp) {
  try {
    await navigator.clipboard?.writeText(fp)
    copiedPath.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedPath.value = false
    }, 1500)
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="vault">
    <header class="vh">
      <div class="vh__id">
        <span class="vh__kicker">▦ STORAGE SCHEMATIC — FIG.01</span>
        <h1 class="vh__title">
          <span class="vh__zh">{{ meta.titleZh }}</span>
          <span class="vh__en">{{ meta.titleEn }}</span>
        </h1>
        <p class="vh__tagline">{{ meta.tagline }}</p>
      </div>

      <!-- 容量：技术量规 -->
      <div class="gauge">
        <div class="gauge__head">
          <span>CAPACITY ⌀</span><span class="gauge__pct">{{ usedPct }}%</span>
        </div>
        <div class="gauge__ruler">
          <span v-for="n in TICKS" :key="n" class="gauge__tick" :class="{ 'is-major': n % 5 === 0 }" />
        </div>
        <div class="gauge__bar">
          <span v-for="n in SEGMENTS" :key="n" class="gauge__seg" :class="{ 'is-lit': n <= litSegments }" />
        </div>
        <div class="gauge__read">
          <span><b>{{ usage.used }}</b> GB</span>
          <span class="gauge__dim">├─ OF {{ usage.total }} GB ─┤</span>
        </div>
      </div>
    </header>

    <!-- 工具条：路径 + 搜索 + 排序 + 视图切换 -->
    <div class="bar">
      <nav class="crumbs">
        <button v-if="path !== '/'" class="crumb crumb--up" title="返回上级目录" @click="goUp">
          <IconBase name="arrow-up" :size="12" />上级
        </button>
        <span class="crumbs__lbl">PATH</span>
        <button class="crumb" :class="{ 'is-cur': path === '/' }" @click="load('/')">
          <IconBase name="hard-drive" :size="13" />ROOT
        </button>
        <template v-for="c in crumbs" :key="c.path">
          <span class="crumb__sep">/</span>
          <button class="crumb" :class="{ 'is-cur': c.path === path }" @click="load(c.path)">{{ c.name }}</button>
        </template>
      </nav>

      <div class="bar__right">
        <span class="bar__count">[ {{ folderCount }} DIR · {{ fileCount }} FILE ]</span>
      </div>
    </div>

    <div class="controls">
      <label class="search">
        <IconBase name="search" :size="14" />
        <input
          ref="searchRef"
          v-model="q"
          type="text"
          placeholder="过滤文件名或类型… (按 / 聚焦)"
          spellcheck="false"
        />
        <button v-if="q" class="search__clear" type="button" aria-label="清除" @click="q = ''">
          <IconBase name="x" :size="13" />
        </button>
      </label>

      <div class="controls__opts">
        <select v-model="sortBy" class="sort" aria-label="排序方式">
          <option value="default">排序: 默认</option>
          <option value="name">排序: 名称</option>
          <option value="size">排序: 大小</option>
          <option value="date">排序: 日期</option>
        </select>

        <div class="vtoggle" role="group" aria-label="视图切换">
          <button
            class="vtoggle__b"
            :class="{ 'is-on': viewMode === 'grid' }"
            title="网格视图"
            @click="viewMode = 'grid'"
          >
            <IconBase name="grid" :size="14" />
          </button>
          <button
            class="vtoggle__b"
            :class="{ 'is-on': viewMode === 'list' }"
            title="列表视图"
            @click="viewMode = 'list'"
          >
            <IconBase name="list" :size="14" />
          </button>
        </div>
      </div>
    </div>

    <p v-if="data?.meta?.source === 'mock'" class="mocktip">当前展示本地示例目录</p>
    <div v-if="loading" class="state"><span class="spin" />读取扇区…</div>
    <div v-else-if="error" class="state state--err">✕ {{ error }}</div>
    <div v-else-if="!entries.length" class="state">— 无匹配项目 —</div>

    <!-- 网格 / 列表视图 -->
    <div v-else :class="viewMode === 'grid' ? 'grid' : 'listview'">
      <button
        v-for="(e, i) in entries"
        :key="e.name"
        class="item"
        :class="{ 'is-folder': e.type === 'folder', 'is-list': viewMode === 'list' }"
        @click="openEntry(e)"
      >
        <span class="item__no">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="item__icon">
          <IconBase :name="e.type === 'folder' ? 'folder' : (KIND_ICON[e.kind] || 'file')" :size="17" />
        </span>
        <span class="item__main">
          <span class="item__name">{{ e.name }}</span>
          <span class="item__meta">
            <span class="item__kind">{{ e.type === 'folder' ? 'DIR' : (e.kind || 'file').toUpperCase() }}</span>
            <span class="item__sep">·</span>
            <span v-if="e.type === 'folder'">{{ e.count }} ITEMS</span>
            <span v-else>{{ sizeFmt(e.size) }}</span>
            <span class="item__sep">·</span>
            <span>{{ e.modified }}</span>
          </span>
        </span>
        <span class="item__badge" v-if="e.type === 'file'">
          {{ e.downloadUrl ? 'ONLINE' : 'INDEX' }}
        </span>
        <span class="item__go">
          <IconBase :name="e.type === 'folder' ? 'chevron-right' : 'file-text'" :size="15" />
        </span>
      </button>
    </div>

    <!-- 蓝图文件规格检视面板 -->
    <Teleport to="body">
      <Transition name="spec">
        <div
          v-if="inspected"
          class="spec-mask"
          role="dialog"
          aria-modal="true"
          :aria-label="inspected.name"
          @click.self="inspected = null"
        >
          <div class="spec">
            <header class="spec__head">
              <span class="spec__kicker">▦ CAD SPEC SHEET // FILE INSPECTOR</span>
              <button class="spec__close" aria-label="关闭" @click="inspected = null">
                <IconBase name="x" :size="15" />
              </button>
            </header>

            <div class="spec__title">
              <span class="spec__ico">
                <IconBase :name="KIND_ICON[inspected.kind] || 'file'" :size="20" />
              </span>
              <div>
                <h2>{{ inspected.name }}</h2>
                <p>{{ inspected.fullPath }}</p>
              </div>
            </div>

            <dl class="spec__rows">
              <div><dt>TYPE</dt><dd>{{ (inspected.kind || 'file').toUpperCase() }}</dd></div>
              <div><dt>SIZE</dt><dd>{{ sizeFmt(inspected.size) }}</dd></div>
              <div><dt>MODIFIED</dt><dd>{{ inspected.modified }}</dd></div>
              <div><dt>NODE STATUS</dt><dd>{{ inspected.downloadUrl ? 'READY FOR TRANSFER' : 'OFFLINE ARCHIVE INDEX' }}</dd></div>
            </dl>

            <footer class="spec__foot">
              <button class="spec__btn" @click="copyFilePath(inspected.fullPath)">
                <IconBase :name="copiedPath ? 'check' : 'copy'" :size="14" />
                <span>{{ copiedPath ? '已复制路径' : '复制路径' }}</span>
              </button>
              <button
                v-if="inspected.downloadUrl"
                class="spec__btn spec__btn--primary"
                @click="downloadFile(inspected)"
              >
                <IconBase name="download" :size="14" />
                <span>下载文件</span>
              </button>
              <span v-else class="spec__offline">离线归档节点 · 仅目录索引</span>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.vault {
  width: min(1100px, 94vw);
  margin: 0 auto;
  padding: clamp(20px, 3.5vh, 36px) 0 36px;
  font-family: var(--font-mono);
}

/* header */
.vh {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 24px;
  padding-bottom: 18px;
  margin-bottom: 14px;
  border-bottom: 1px dashed color-mix(in srgb, var(--accent-a) 40%, transparent);
}
.vh__kicker {
  font-size: 0.62rem;
  letter-spacing: 2.5px;
  color: var(--accent-a);
}
.vh__title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 14px;
  margin: 12px 0 10px;
}
.vh__zh {
  font-family: var(--font-sans);
  font-size: clamp(2rem, 5vw, 3.1rem);
  font-weight: 700;
  letter-spacing: 4px;
  color: #eaf4ff;
  text-shadow: 0 0 18px color-mix(in srgb, var(--accent-a) 45%, transparent);
}
.vh__en {
  font-size: clamp(0.66rem, 1.4vw, 0.82rem);
  letter-spacing: 5px;
  color: var(--text-dim);
}
.vh__tagline {
  max-width: 48ch;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-soft);
}

/* gauge */
.gauge {
  width: min(330px, 42vw);
}
.gauge__head {
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  letter-spacing: 1.6px;
  color: var(--text-dim);
}
.gauge__pct {
  color: var(--accent-a);
}
.gauge__ruler {
  display: flex;
  justify-content: space-between;
  height: 8px;
  margin: 8px 0 3px;
}
.gauge__tick {
  width: 1px;
  height: 4px;
  background: color-mix(in srgb, var(--accent-a) 40%, transparent);
}
.gauge__tick.is-major {
  height: 8px;
  background: color-mix(in srgb, var(--accent-a) 70%, transparent);
}
.gauge__bar {
  display: flex;
  gap: 2px;
  height: 20px;
}
.gauge__seg {
  flex: 1;
  background: rgba(130, 190, 255, 0.1);
  border-top: 1px solid rgba(130, 190, 255, 0.18);
  transition: background 0.3s, box-shadow 0.3s;
}
.gauge__seg.is-lit {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent-a) 85%, transparent), color-mix(in srgb, var(--accent-a) 35%, transparent));
  box-shadow: 0 0 7px -1px color-mix(in srgb, var(--accent-a) 70%, transparent);
}
.gauge__read {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 7px;
  font-size: 0.62rem;
  color: var(--text-soft);
}
.gauge__read b {
  color: var(--accent-a);
  font-size: 0.9rem;
}
.gauge__dim {
  color: var(--text-dim);
}

/* toolbar */
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 0;
}
.crumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.68rem;
}
.crumbs__lbl {
  font-size: 0.54rem;
  letter-spacing: 2px;
  color: var(--text-dim);
  margin-right: 4px;
}
.crumb {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  color: var(--text-dim);
  border: 1px solid transparent;
  transition: color 0.25s, border-color 0.25s, background 0.25s;
}
.crumb--up {
  color: var(--accent-c);
  border-color: color-mix(in srgb, var(--accent-c) 35%, transparent);
  background: color-mix(in srgb, var(--accent-c) 8%, transparent);
}
.crumb:hover {
  color: var(--text);
  border-color: color-mix(in srgb, var(--accent-a) 35%, transparent);
}
.crumb.is-cur {
  color: var(--accent-a);
  border-color: color-mix(in srgb, var(--accent-a) 45%, transparent);
}
.crumb__sep {
  color: var(--text-dim);
  opacity: 0.5;
}
.bar__count {
  font-size: 0.62rem;
  letter-spacing: 1px;
  color: var(--accent-a);
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin: 8px 0 18px;
}
.search {
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  color: var(--text-dim);
  background: rgba(8, 24, 50, 0.55);
  border: 1px solid color-mix(in srgb, var(--accent-a) 28%, transparent);
  transition: border-color 0.25s, color 0.25s;
}
.search:focus-within {
  border-color: var(--accent-a);
  color: var(--accent-a);
}
.search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: none;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.8rem;
}
.search input::placeholder {
  color: var(--text-dim);
}
.search__clear {
  display: grid;
  place-items: center;
  color: var(--text-dim);
}
.search__clear:hover {
  color: var(--accent-a);
}

.controls__opts {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sort {
  padding: 8px 10px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-soft);
  background: rgba(8, 24, 50, 0.65);
  border: 1px solid color-mix(in srgb, var(--accent-a) 28%, transparent);
  outline: none;
  cursor: pointer;
}
.vtoggle {
  display: inline-flex;
  border: 1px solid color-mix(in srgb, var(--accent-a) 28%, transparent);
  background: rgba(8, 24, 50, 0.55);
}
.vtoggle__b {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: var(--text-dim);
  transition: color 0.2s, background 0.2s;
}
.vtoggle__b.is-on {
  color: #071732;
  background: var(--accent-a);
}

.mocktip {
  margin-bottom: 12px;
  font-size: 0.72rem;
  color: var(--text-dim);
}

/* grid & list views */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
  gap: 10px;
}
.listview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 13px;
  text-align: left;
  color: var(--text);
  border: 1px solid color-mix(in srgb, var(--accent-a) 25%, transparent);
  background: rgba(10, 28, 56, 0.45);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s var(--ease-out), background 0.25s;
}
.item.is-list {
  padding: 9px 14px;
}
.item::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px dashed transparent;
  pointer-events: none;
  transition: border-color 0.25s;
}
.item:hover {
  transform: translateY(-2px);
  border-color: var(--accent-a);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-a) 30%, transparent),
    0 12px 30px -22px color-mix(in srgb, var(--accent-a) 95%, transparent);
  background: rgba(14, 40, 78, 0.56);
}
.item:hover::before {
  border-color: color-mix(in srgb, var(--accent-a) 30%, transparent);
}
.item__no {
  font-size: 0.56rem;
  color: var(--text-dim);
  align-self: flex-start;
}
.item.is-list .item__no {
  align-self: center;
}
.item__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: none;
  color: var(--accent-a);
  border: 1px solid color-mix(in srgb, var(--accent-a) 35%, transparent);
}
.item.is-folder .item__icon {
  color: var(--accent-c);
  border-color: color-mix(in srgb, var(--accent-c) 45%, transparent);
}
.item__main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.item.is-list .item__main {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.item__name {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.58rem;
  letter-spacing: 0.5px;
  color: var(--text-dim);
}
.item__kind {
  color: var(--accent-a);
}
.item.is-folder .item__kind {
  color: var(--accent-c);
}
.item__sep {
  opacity: 0.5;
}
.item__badge {
  font-size: 0.52rem;
  padding: 2px 6px;
  color: var(--text-dim);
  border: 1px solid color-mix(in srgb, var(--accent-a) 22%, transparent);
}
.item__go {
  color: var(--text-dim);
  opacity: 0;
  transform: translateX(-3px);
  transition: opacity 0.25s, transform 0.25s var(--ease-out), color 0.25s;
}
.item:hover .item__go {
  opacity: 1;
  transform: translateX(0);
  color: var(--accent-a);
}

/* spec inspector modal */
.spec-mask {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  background: rgba(4, 12, 28, 0.76);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
.spec {
  width: min(480px, 92vw);
  padding: 18px 20px;
  font-family: var(--font-mono);
  background: rgba(8, 24, 50, 0.94);
  border: 1px solid color-mix(in srgb, var(--accent-a) 45%, transparent);
  box-shadow: 0 28px 70px -16px rgba(0, 0, 0, 0.85),
    0 0 36px -14px color-mix(in srgb, var(--accent-a) 45%, transparent);
}
.spec__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px dashed color-mix(in srgb, var(--accent-a) 30%, transparent);
}
.spec__kicker {
  font-size: 0.62rem;
  letter-spacing: 1.4px;
  color: var(--accent-a);
}
.spec__close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: var(--text-soft);
  border: 1px solid color-mix(in srgb, var(--accent-a) 28%, transparent);
}
.spec__close:hover {
  color: var(--accent-a);
}
.spec__title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.spec__ico {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  color: var(--accent-a);
  border: 1px solid color-mix(in srgb, var(--accent-a) 42%, transparent);
}
.spec__title h2 {
  font-family: var(--font-sans);
  font-size: 1.06rem;
  color: #fff;
  word-break: break-all;
}
.spec__title p {
  margin-top: 3px;
  font-size: 0.68rem;
  color: var(--text-dim);
}
.spec__rows {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 12px;
  background: rgba(5, 16, 36, 0.55);
  border: 1px solid color-mix(in srgb, var(--accent-a) 20%, transparent);
}
.spec__rows dt {
  font-size: 0.54rem;
  letter-spacing: 1.2px;
  color: var(--text-dim);
}
.spec__rows dd {
  margin-top: 3px;
  font-size: 0.76rem;
  color: var(--text);
}
.spec__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}
.spec__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 13px;
  font-size: 0.72rem;
  color: var(--accent-a);
  border: 1px solid color-mix(in srgb, var(--accent-a) 40%, transparent);
  background: color-mix(in srgb, var(--accent-a) 10%, transparent);
}
.spec__btn--primary {
  color: #071732;
  background: var(--accent-a);
  font-weight: 700;
}
.spec__offline {
  font-size: 0.68rem;
  color: var(--accent-c);
}

.spec-enter-active,
.spec-leave-active {
  transition: opacity 0.2s var(--ease-out);
}
.spec-enter-from,
.spec-leave-to {
  opacity: 0;
}

/* states */
.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  font-size: 0.78rem;
  letter-spacing: 1px;
  color: var(--text-dim);
}
.state--err {
  color: #ff9aa8;
}
.spin {
  width: 15px;
  height: 15px;
  border: 2px solid color-mix(in srgb, var(--accent-a) 28%, transparent);
  border-top-color: var(--accent-a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 720px) {
  .vh {
    grid-template-columns: 1fr;
    align-items: start;
  }
  .gauge {
    width: 100%;
  }
  .item.is-list .item__main {
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
  }
}
</style>
