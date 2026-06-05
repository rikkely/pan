<script setup>
import config from './config.js'
import BlueprintStage from './components/BlueprintStage.vue'
import PanVault from './components/PanVault.vue'
import IconBase from './components/IconBase.vue'

// 固定蓝图配色（独立风格，不跟随主页主题）
const s = document.documentElement.style
s.setProperty('--accent-a', '#6fd3ff')
s.setProperty('--accent-b', '#a9d8ff')
s.setProperty('--accent-c', '#ffd166')
s.setProperty('--bg-0', '#071732')
s.setProperty('--text', 'rgba(226, 240, 255, 0.95)')
s.setProperty('--text-soft', 'rgba(200, 224, 255, 0.74)')
s.setProperty('--text-dim', 'rgba(170, 205, 255, 0.5)')

const host = `${config.site.name}${config.site.suffix || ''}`
document.title = `${host} · 数据仓库`

const fav = document.querySelector("link[rel='icon']") || document.createElement('link')
fav.setAttribute('rel', 'icon')
fav.removeAttribute('type')
fav.setAttribute('href', config.site.avatar)
if (!fav.parentNode) document.head.appendChild(fav)

const f = config.footer || {}
const year = new Date().getFullYear()
</script>

<template>
  <BlueprintStage />

  <!-- 制图标题栏（title block） -->
  <header class="tb">
    <a class="tb__cell tb__home" :href="config.site.homeUrl"><IconBase name="arrow-left" :size="14" />HOME</a>
    <span class="tb__cell"><i>DWG NO.</i>AUR-PAN-001</span>
    <span class="tb__cell tb__cell--grow"><i>TITLE</i>DATA VAULT · 数据仓库</span>
    <span class="tb__cell"><i>REV</i>A</span>
    <span class="tb__cell"><i>SCALE</i>1:1</span>
    <span class="tb__cell"><i>SHEET</i>1/1</span>
  </header>

  <main class="page"><PanVault /></main>

  <footer class="tbf">
    <span><i>DRAWN</i>{{ f.author }}</span>
    <span><i>DATE</i>{{ f.startYear }}–{{ year }}</span>
    <span class="tbf__note">UNAUTHORIZED DUPLICATION PROHIBITED</span>
    <a :href="config.site.homeUrl">◄ RETURN TO CONSOLE</a>
  </footer>
</template>

<style scoped>
.tb,
.tbf {
  width: min(1100px, 94vw);
  margin: 0 auto;
  display: flex;
  align-items: stretch;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--text-soft);
  border: 1px solid color-mix(in srgb, var(--accent-a) 38%, transparent);
  background: rgba(8, 24, 50, 0.55);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}
.tb {
  position: sticky;
  top: 10px;
  z-index: 50;
  margin-top: 22px;
}
.tb__cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: 8px 14px;
  border-right: 1px solid color-mix(in srgb, var(--accent-a) 28%, transparent);
  white-space: nowrap;
}
.tb__cell i {
  font-style: normal;
  font-size: 0.5rem;
  color: var(--text-dim);
}
.tb__cell--grow {
  flex: 1;
  color: var(--accent-a);
}
.tb__home {
  flex-direction: row;
  align-items: center;
  gap: 6px;
  color: var(--accent-a);
  transition: background 0.25s;
}
.tb__home:hover {
  background: color-mix(in srgb, var(--accent-a) 14%, transparent);
}

.page {
  position: relative;
  z-index: 1;
}

.tbf {
  margin-top: 26px;
  margin-bottom: 26px;
  align-items: center;
  flex-wrap: wrap;
}
.tbf span {
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
  padding: 9px 14px;
  border-right: 1px solid color-mix(in srgb, var(--accent-a) 22%, transparent);
}
.tbf i {
  font-style: normal;
  font-size: 0.5rem;
  color: var(--text-dim);
}
.tbf__note {
  flex: 1;
  color: var(--text-dim);
  letter-spacing: 2px;
}
.tbf a {
  padding: 9px 14px;
  color: var(--accent-a);
}
.tbf a:hover {
  background: color-mix(in srgb, var(--accent-a) 12%, transparent);
}

@media (max-width: 720px) {
  .tb__cell--grow span,
  .tb__cell i { display: none; }
  .tb { font-size: 0.56rem; }
}
</style>
