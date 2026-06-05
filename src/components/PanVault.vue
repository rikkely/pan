<script setup>
import { ref, computed, onMounted } from 'vue'
import config from '../config.js'
import { fetchList } from '../api/client.js'
import IconBase from './IconBase.vue'

const meta = config.vault || {}

const path = ref('/')
const data = ref(null)
const loading = ref(true)
const error = ref(null)

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
  loading.value = true
  error.value = null
  try {
    data.value = await fetchList(p)
    path.value = p
  } catch (e) {
    error.value = e?.message || '读取失败'
  } finally {
    loading.value = false
  }
}
onMounted(() => load('/'))

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

const usage = computed(() => data.value?.usage || { used: 0, total: 1 })
const usedPct = computed(() => Math.min(100, Math.round((usage.value.used / usage.value.total) * 100)))
const TICKS = 20
const SEGMENTS = 40
const litSegments = computed(() => Math.round((usedPct.value / 100) * SEGMENTS))

const entries = computed(() => data.value?.entries || [])
const folderCount = computed(() => entries.value.filter((e) => e.type === 'folder').length)
const fileCount = computed(() => entries.value.filter((e) => e.type === 'file').length)

function sizeFmt(kb) {
  if (!kb) return '——'
  if (kb < 1024) return `${kb} KB`
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${(kb / 1024 / 1024).toFixed(2)} GB`
}
function openEntry(e) {
  if (e.type === 'folder') {
    const next = path.value === '/' ? `/${e.name}` : `${path.value}/${e.name}`
    load(next)
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

    <!-- 工具条：路径 -->
    <div class="bar">
      <nav class="crumbs">
        <span class="crumbs__lbl">PATH</span>
        <button class="crumb" :class="{ 'is-cur': path === '/' }" @click="load('/')">
          <IconBase name="hard-drive" :size="13" />ROOT
        </button>
        <template v-for="c in crumbs" :key="c.path">
          <span class="crumb__sep">/</span>
          <button class="crumb" :class="{ 'is-cur': c.path === path }" @click="load(c.path)">{{ c.name }}</button>
        </template>
      </nav>
      <span class="bar__count">[ {{ folderCount }} DIR · {{ fileCount }} FILE ]</span>
    </div>

    <div v-if="loading" class="state"><span class="spin" />读取扇区…</div>
    <div v-else-if="error" class="state state--err">✕ {{ error }}</div>
    <div v-else-if="!entries.length" class="state">— 空目录 —</div>
    <div v-else class="grid">
      <button
        v-for="(e, i) in entries"
        :key="e.name"
        class="item"
        :class="{ 'is-folder': e.type === 'folder' }"
        @click="openEntry(e)"
      >
        <span class="item__no">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="item__icon">
          <IconBase :name="e.type === 'folder' ? 'folder' : (KIND_ICON[e.kind] || 'file')" :size="18" />
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
        <span class="item__go">
          <IconBase :name="e.type === 'folder' ? 'chevron-right' : 'download'" :size="15" />
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.vault {
  width: min(1100px, 94vw);
  margin: 0 auto;
  padding: clamp(20px, 3.5vh, 38px) 0 40px;
  font-family: var(--font-mono);
}

/* header */
.vh {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 24px;
  padding-bottom: 18px;
  margin-bottom: 16px;
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
  height: 22px;
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
  gap: 12px;
  margin-bottom: 16px;
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
  gap: 6px;
  padding: 4px 9px;
  color: var(--text-dim);
  border: 1px solid transparent;
  transition: color 0.25s, border-color 0.25s;
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

/* grid — schematic blocks */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
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
  background: rgba(10, 28, 56, 0.4);
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s var(--ease-out), background 0.25s;
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
  background: rgba(14, 40, 78, 0.5);
}
.item:hover::before {
  border-color: color-mix(in srgb, var(--accent-a) 30%, transparent);
}
.item__no {
  font-size: 0.56rem;
  color: var(--text-dim);
  align-self: flex-start;
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
}
</style>
