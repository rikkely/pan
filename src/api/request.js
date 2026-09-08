const pending = new Map()
const MAX_AGE = 60_000

export async function requestJson(url, validate) {
  const key = `aurora:api:v1:${url}`
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (cached && Date.now() - cached.time < MAX_AGE && validate(cached.data)) return cached.data
  } catch {
    // 存储不可用或缓存失效时直接请求，不阻断页面。
  }
  if (pending.has(url)) return pending.get(url)

  const task = (async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      })
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`)
        error.status = response.status
        const payload = await response.json().catch(() => null)
        error.code = payload?.error?.code
        throw error
      }
      const data = await response.json()
      if (!validate(data)) throw new Error('接口数据格式不正确')
      try {
        sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), data }))
      } catch {
        // 配额不足不影响本次请求结果。
      }
      return data
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('请求超时，请稍后重试')
      throw error
    } finally {
      clearTimeout(timer)
    }
  })()
  pending.set(url, task)
  try {
    return await task
  } finally {
    pending.delete(url)
  }
}
