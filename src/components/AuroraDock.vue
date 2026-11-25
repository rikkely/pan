<script setup>
defineProps({
  active: { type: String, required: true }
})

const CABINS = [
  { id: 'home', label: '主控台', url: '/' },
  { id: 'blog', label: '博客', url: '/blog/' },
  { id: 'pan', label: '网盘', url: '/pan/' },
  { id: 'music', label: '音乐', url: '/music/' },
  { id: 'start', label: '起始页', url: '/start/' },
  { id: 'nav', label: '网址集', url: '/nav/' },
  { id: 'lab', label: '实验室', url: '/lab/' }
]
</script>

<template>
  <nav class="adock" aria-label="Aurora 空间导航">
    <div class="adock__bar">
      <a
        v-for="c in CABINS"
        :key="c.id"
        class="adock__item"
        :class="{ 'is-on': c.id === active }"
        :href="c.url"
      >
        <span class="adock__dot" aria-hidden="true" />
        <span>{{ c.label }}</span>
      </a>
    </div>
  </nav>
</template>

<style scoped>
.adock {
  position: fixed;
  left: 50%;
  bottom: max(16px, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 80;
  max-width: 94vw;
}
.adock__bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: 999px;
  background: rgba(7, 23, 50, 0.84);
  border: 1px solid color-mix(in srgb, var(--accent-a) 34%, transparent);
  box-shadow: 0 18px 44px -14px rgba(0, 0, 0, 0.85),
    inset 0 1px 0 rgba(169, 216, 255, 0.14);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  backdrop-filter: blur(18px) saturate(150%);
  overflow-x: auto;
  scrollbar-width: none;
}
.adock__bar::-webkit-scrollbar {
  display: none;
}
.adock__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-family: var(--font-sans);
  font-size: 0.76rem;
  font-weight: 500;
  white-space: nowrap;
  color: var(--text-soft);
  transition: color 0.25s, background 0.25s;
}
.adock__item:hover {
  color: #fff;
  background: color-mix(in srgb, var(--accent-a) 16%, transparent);
}
.adock__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.4;
}
.adock__item.is-on {
  color: #071732;
  background: var(--accent-a);
  font-weight: 700;
  box-shadow: 0 0 16px -4px color-mix(in srgb, var(--accent-a) 70%, transparent);
}
.adock__item.is-on .adock__dot {
  opacity: 0.9;
}
</style>
