/**
 * 网盘数据访问层。后端就绪前返回写死目录树。
 *
 *  REST 契约（live 模式）：
 *    GET {base}/pan/list?path=/      → { path, usage:{used,total}, entries:[Entry] }
 *    Entry = { type:'folder'|'file', name, kind, size, modified }
 *      kind ∈ doc | image | video | audio | archive | code | other
 *
 *  size 单位 KB（folder 可为 0 或子项数）。
 */
import config from '../config.js'

const MODE = config.api?.mode || 'mock'
const BASE = config.api?.base || '/api'
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

const USAGE = { used: 412.8, total: 1024 } // GB

const TREE = {
  '/': [
    { type: 'folder', name: '文档', kind: 'doc', size: 0, modified: '2026-05-30', count: 24 },
    { type: 'folder', name: '影像', kind: 'image', size: 0, modified: '2026-05-22', count: 318 },
    { type: 'folder', name: '影音', kind: 'video', size: 0, modified: '2026-04-18', count: 12 },
    { type: 'folder', name: '归档', kind: 'archive', size: 0, modified: '2026-03-09', count: 7 },
    { type: 'folder', name: '代码快照', kind: 'code', size: 0, modified: '2026-06-01', count: 41 },
    { type: 'file', name: 'README.txt', kind: 'doc', size: 4, modified: '2026-06-02' },
    { type: 'file', name: '星图采集.psd', kind: 'image', size: 248320, modified: '2026-05-28' },
    { type: 'file', name: '座舱配色.sketch', kind: 'image', size: 51200, modified: '2026-05-20' },
    { type: 'file', name: 'backup-2026Q2.tar.gz', kind: 'archive', size: 1887436, modified: '2026-04-01' }
  ],
  '/文档': [
    { type: 'file', name: '部署手记.md', kind: 'doc', size: 22, modified: '2026-05-30' },
    { type: 'file', name: '航线规划.pdf', kind: 'doc', size: 3148, modified: '2026-05-12' },
    { type: 'file', name: '会议纪要-0428.docx', kind: 'doc', size: 86, modified: '2026-04-28' },
    { type: 'file', name: '预算表.xlsx', kind: 'doc', size: 142, modified: '2026-04-10' }
  ],
  '/影像': [
    { type: 'file', name: 'aurora-01.webp', kind: 'image', size: 2048, modified: '2026-05-22' },
    { type: 'file', name: 'aurora-02.webp', kind: 'image', size: 1960, modified: '2026-05-22' },
    { type: 'file', name: 'nebula-render.png', kind: 'image', size: 8421, modified: '2026-05-19' }
  ],
  '/影音': [
    { type: 'file', name: '启航纪录.mp4', kind: 'video', size: 734003, modified: '2026-04-18' },
    { type: 'file', name: '环境音-深空.flac', kind: 'audio', size: 41208, modified: '2026-04-02' }
  ],
  '/归档': [
    { type: 'file', name: 'site-2025.zip', kind: 'archive', size: 512000, modified: '2026-01-03' }
  ],
  '/代码快照': [
    { type: 'file', name: 'aurora-home.bundle', kind: 'code', size: 18044, modified: '2026-06-01' },
    { type: 'file', name: 'aurora-blog.bundle', kind: 'code', size: 9622, modified: '2026-06-01' }
  ]
}

async function http(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchList(path = '/') {
  if (MODE === 'live') return http(`/pan/list?path=${encodeURIComponent(path)}`)
  await delay(160)
  return { path, usage: USAGE, entries: TREE[path] || [] }
}
