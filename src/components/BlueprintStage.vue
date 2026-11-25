<script setup>
// 纯装饰：工程蓝图 / 制图桌背景（方格纸 + 制图边框 + 标尺刻度 + 定位十字）
</script>

<template>
  <div class="bp" aria-hidden="true">
    <div class="bp__paper" />
    <div class="bp__fine" />
    <div class="bp__bold" />
    <div class="bp__deco">
      <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
        <circle cx="200" cy="200" r="150" />
        <circle cx="200" cy="200" r="96" />
        <line x1="20" y1="200" x2="380" y2="200" />
        <line x1="200" y1="20" x2="200" y2="380" />
        <path d="M200 50 L210 70 L190 70 Z" />
      </svg>
    </div>
    <div class="bp__frame">
      <span class="bp__reg bp__reg--tl" />
      <span class="bp__reg bp__reg--tr" />
      <span class="bp__reg bp__reg--bl" />
      <span class="bp__reg bp__reg--br" />
    </div>
    <div class="bp__vignette" />
  </div>
</template>

<style scoped>
.bp {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background:
    radial-gradient(130% 110% at 50% 0%, #0e2c54 0%, #0a2143 45%, #071732 100%);
}
.bp__paper {
  position: absolute;
  inset: 0;
  opacity: 0.5;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}
.bp__fine {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(120, 190, 255, 0.11) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 190, 255, 0.11) 1px, transparent 1px);
  background-size: 24px 24px;
  -webkit-mask: radial-gradient(ellipse 85% 75% at 50% 45%, rgba(0, 0, 0, 0.35) 0%, #000 72%);
  mask: radial-gradient(ellipse 85% 75% at 50% 45%, rgba(0, 0, 0, 0.35) 0%, #000 72%);
}
.bp__bold {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(150, 210, 255, 0.2) 1.2px, transparent 1.2px),
    linear-gradient(90deg, rgba(150, 210, 255, 0.2) 1.2px, transparent 1.2px);
  background-size: 120px 120px;
  -webkit-mask: radial-gradient(ellipse 85% 75% at 50% 45%, rgba(0, 0, 0, 0.42) 0%, #000 72%);
  mask: radial-gradient(ellipse 85% 75% at 50% 45%, rgba(0, 0, 0, 0.42) 0%, #000 72%);
}
.bp__deco {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(70vw, 70vh);
  height: min(70vw, 70vh);
  transform: translate(-50%, -50%);
  opacity: 0.12;
}
.bp__deco svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: #add6ff;
  stroke-width: 0.6;
  stroke-dasharray: 4 4;
}
.bp__frame {
  position: absolute;
  inset: 16px;
  border: 1px solid rgba(150, 210, 255, 0.3);
}
.bp__reg {
  position: absolute;
  width: 22px;
  height: 22px;
}
.bp__reg::before,
.bp__reg::after {
  content: '';
  position: absolute;
  background: rgba(150, 210, 255, 0.55);
}
.bp__reg::before { left: 50%; top: 0; width: 1px; height: 100%; transform: translateX(-50%); }
.bp__reg::after { top: 50%; left: 0; height: 1px; width: 100%; transform: translateY(-50%); }
.bp__reg--tl { top: -11px; left: -11px; }
.bp__reg--tr { top: -11px; right: -11px; }
.bp__reg--bl { bottom: -11px; left: -11px; }
.bp__reg--br { bottom: -11px; right: -11px; }
.bp__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 100% at 50% 40%, transparent 55%, rgba(4, 12, 28, 0.6) 100%);
}
</style>
