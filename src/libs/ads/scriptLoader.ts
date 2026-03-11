/**
 * 脚本加载工具 — 动态向 <head> 注入第三方广告 SDK 脚本
 */

const loadedScripts = new Map<string, Promise<void>>()

export function loadScript(src: string, id?: string): Promise<void> {
  const key = id ?? src

  if (loadedScripts.has(key)) {
    return loadedScripts.get(key)!
  }

  const promise = new Promise<void>((resolve, reject) => {
    if (id && document.getElementById(id)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    if (id) {
      script.id = id
    }
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`广告 SDK 脚本加载失败: ${src}`))
    document.head.appendChild(script)
  })

  loadedScripts.set(key, promise)
  return promise
}

export function isScriptLoaded(id: string): boolean {
  return Boolean(document.getElementById(id))
}
