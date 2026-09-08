/**
 * AURORA // DATA VAULT —— 网盘前端配置（独立可部署，挂载于 /pan/）
 * 后端就绪前走 src/api/client.js 的写死数据；接好后端把 api.mode 改 'live'。
 */
import avatar from './assets/images/avatar.jpg'

export default {
  site: {
    name: 'rikkely',
    suffix: '.top',
    avatar,
    author: 'rikkely',
    homeUrl: '/'
  },

  // 加载页文案
  boot: { label: 'MOUNTING DATA VAULT', sub: 'STORAGE NODE' },

  // 页头
  vault: {
    titleZh: '数据仓库',
    titleEn: 'DATA VAULT',
    tagline: '加密存储节点 —— 文档、影像与归档资料的离线镜像。'
  },

  background: { interval: 15000, images: [] },
  footer: { startYear: 2023, author: 'rikkely', icp: '', icpLink: 'https://beian.miit.gov.cn/' },

  api: {
    mode: import.meta.env.VITE_API_MODE || 'live',
    base: import.meta.env.VITE_API_BASE || '/api',
    fallbackToMock: import.meta.env.VITE_API_FALLBACK_TO_MOCK !== 'false'
  },

  theme: { accentA: '#67e8f9', accentB: '#a78bfa', accentC: '#f472b6' }
}
