export const CLOUD_TOKEN_KEY = 'offline-recorder-cloud-token'
export const CLOUD_USER_KEY = 'offline-recorder-cloud-user'
export const CLOUD_API_BASE_KEY = 'offline-recorder-cloud-api-base'

const DEFAULT_CLOUD_API_BASE = (process.env.VUE_APP_CLOUD_API_BASE as string) || 'http://127.0.0.1:9531'

export interface CloudUserProfile {
  id: string
  username: string
  balance_cents: number
  balance_yuan: number
  vip_expires_at: number | null
  is_vip: boolean
  account_authorized?: boolean
  authorization_labels?: string[]
  force_vip_authorized?: boolean
  created_at?: number
  updated_at?: number
}

export interface CloudSessionInfo {
  single_login: boolean
  created_at: number
  expires_at: number
}

export interface CloudAuthorizationSummary {
  account_authorized: boolean
  force_vip: boolean
  labels: string[]
  included_temp_access_seconds: number
  overdraft_limit_seconds: number
}

export interface CloudAccessSummary {
  temp_access_seconds: number
  pending_temp_access_seconds: number
  included_temp_access_seconds: number
  effective_temp_access_seconds: number
  effective_temp_access_minutes: number
  overdraft_limit_seconds: number
  available_with_overdraft_seconds: number
  overdraft_in_use: boolean
  rewarded_ad_count_today: number
  rewarded_ad_daily_limit: number
  rewarded_ad_seconds_today: number
  consumed_seconds_today: number
  next_settlement_at: number
}

export interface CloudAccountSummary {
  user: CloudUserProfile
  session: CloudSessionInfo
  authorization: CloudAuthorizationSummary
  access: CloudAccessSummary
  vip_monthly_price_cents: number
  vip_monthly_price_yuan: number
}

export interface CloudAuthPayload extends CloudAccountSummary {
  token: string
}

type CloudStoredSession = {
  token: string
  user: CloudUserProfile
}

export interface CloudRechargeOrder {
  id: string
  provider: 'wechat' | 'alipay'
  provider_label: string
  amount_cents: number
  amount_yuan: number
  status: 'pending' | 'paid' | 'canceled'
  checkout_url?: string | null
  provider_order_id?: string | null
  payment_payload?: Record<string, any> | null
  status_message?: string | null
  created_at: number
  paid_at?: number | null
}

interface CloudEnvelope<T> {
  success: boolean
  data: T
  error?: {
    code?: string
    message?: string
  } | string
  timestamp: number
}

interface CloudRequestOptions extends Omit<RequestInit, 'body'> {
  query?: Record<string, string | number | boolean | null | undefined>
  auth?: boolean
  responseType?: 'json' | 'blob' | 'text'
  body?: any
}

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getCloudApiBaseUrl() {
  if (!storageAvailable()) {
    return DEFAULT_CLOUD_API_BASE
  }
  return window.localStorage.getItem(CLOUD_API_BASE_KEY) || DEFAULT_CLOUD_API_BASE
}

export function setCloudApiBaseUrl(value: string) {
  if (!storageAvailable()) return DEFAULT_CLOUD_API_BASE
  const normalized = String(value || '').trim().replace(/\/$/, '') || DEFAULT_CLOUD_API_BASE
  window.localStorage.setItem(CLOUD_API_BASE_KEY, normalized)
  return normalized
}

export function getCloudToken() {
  if (!storageAvailable()) return ''
  return window.localStorage.getItem(CLOUD_TOKEN_KEY) || ''
}

export function hasCloudToken() {
  return Boolean(getCloudToken())
}

export function getStoredCloudUser(): CloudUserProfile | null {
  if (!storageAvailable()) return null
  const raw = window.localStorage.getItem(CLOUD_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (error) {
    return null
  }
}

export function saveCloudSession(payload: CloudStoredSession) {
  if (!storageAvailable()) return payload
  window.localStorage.setItem(CLOUD_TOKEN_KEY, payload.token)
  window.localStorage.setItem(CLOUD_USER_KEY, JSON.stringify(payload.user))
  return payload
}

export function clearCloudSession() {
  if (!storageAvailable()) return
  window.localStorage.removeItem(CLOUD_TOKEN_KEY)
  window.localStorage.removeItem(CLOUD_USER_KEY)
}

function buildUrl(path: string, query?: CloudRequestOptions['query']) {
  const base = getCloudApiBaseUrl().replace(/\/$/, '')
  const url = new URL(path, base)
  if (query) {
    Object.keys(query).forEach((key) => {
      const value = query[key]
      if (value === undefined || value === null || value === '') return
      url.searchParams.set(key, String(value))
    })
  }
  return url.toString()
}

function normalizeError(payload: any, fallback: string) {
  if (!payload) return fallback
  if (typeof payload === 'string') return payload
  if (typeof payload.error === 'string') return payload.error
  if (payload.error && payload.error.message) return payload.error.message
  return fallback
}

export async function cloudRequest<T = any>(path: string, options: CloudRequestOptions = {}): Promise<T> {
  const {
    query,
    auth = false,
    responseType = 'json',
    headers,
    body,
    ...rest
  } = options

  const requestHeaders = new Headers(headers || {})
  const init: RequestInit = {
    ...rest,
    headers: requestHeaders,
  }

  if (auth) {
    const token = getCloudToken()
    if (!token) {
      throw new Error('未检测到云登录 token')
    }
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  if (body !== undefined && body !== null) {
    if (
      typeof body === 'string' ||
      body instanceof Blob ||
      body instanceof FormData ||
      body instanceof URLSearchParams ||
      body instanceof ArrayBuffer
    ) {
      init.body = body as BodyInit
    } else if (body instanceof Uint8Array) {
      init.body = body as any
    } else {
      requestHeaders.set('Content-Type', 'application/json')
      init.body = JSON.stringify(body)
    }
  }

  const response = await fetch(buildUrl(path, query), init)

  if (responseType === 'blob') {
    if (!response.ok) {
      let payload = null
      try {
        payload = await response.json()
      } catch (error) {
        // ignore
      }
      throw new Error(normalizeError(payload, response.statusText || '云服务请求失败'))
    }
    return await response.blob() as any
  }

  if (responseType === 'text') {
    const text = await response.text()
    if (!response.ok) {
      throw new Error(text || response.statusText || '云服务请求失败')
    }
    return text as any
  }

  const payload: CloudEnvelope<T> = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(normalizeError(payload, response.statusText || '云服务请求失败'))
  }
  return payload.data
}

export async function cloudRegister(username: string, password: string) {
  const data = await cloudRequest<CloudAuthPayload>('/api/v1/auth/register', {
    method: 'POST',
    body: { username, password },
  })
  return saveCloudSession(data)
}

export async function cloudLogin(username: string, password: string) {
  const data = await cloudRequest<CloudAuthPayload>('/api/v1/auth/login', {
    method: 'POST',
    body: { username, password },
  })
  return saveCloudSession(data)
}

export async function cloudMe() {
  const data = await cloudRequest<CloudAccountSummary>('/api/v1/auth/me', {
    method: 'GET',
    auth: true,
  })
  if (data && data.user) {
    saveCloudSession({ token: getCloudToken(), user: data.user })
  }
  return data
}

export async function cloudLogout() {
  try {
    await cloudRequest('/api/v1/auth/logout', {
      method: 'POST',
      auth: true,
    })
  } finally {
    clearCloudSession()
  }
}

export async function cloudBillingSummary() {
  return await cloudRequest<CloudAccountSummary & { orders: CloudRechargeOrder[] }>('/api/v1/billing/summary', {
    method: 'GET',
    auth: true,
  })
}

export async function cloudCreateRechargeOrder(provider: 'wechat' | 'alipay', amountCents: number) {
  return await cloudRequest<{ order: CloudRechargeOrder, payment_hint: string }>('/api/v1/billing/recharge', {
    method: 'POST',
    auth: true,
    body: {
      provider,
      amount_cents: amountCents,
    },
  })
}

export async function cloudConfirmRechargeOrder(orderId: string) {
  return await cloudRequest<{ user: CloudUserProfile, order: CloudRechargeOrder }>(`/api/v1/billing/orders/${encodeURIComponent(orderId)}/confirm`, {
    method: 'POST',
    auth: true,
  })
}

export async function cloudActivateVip() {
  return await cloudRequest<CloudAccountSummary & { message: string }>('/api/v1/vip/activate', {
    method: 'POST',
    auth: true,
  })
}

export async function cloudRedeemVipKey(key: string) {
  return await cloudRequest<CloudAccountSummary & { message: string, redemption?: Record<string, any> }>('/api/v1/vip/redeem-key', {
    method: 'POST',
    auth: true,
    body: { key },
  })
}

export async function cloudClaimAdReward(provider: string, slotId: string) {
  return await cloudRequest<CloudAccountSummary & { message: string }>('/api/v1/access/reward-ad', {
    method: 'POST',
    auth: true,
    body: {
      provider,
      slot_id: slotId,
    },
  })
}

export async function cloudConsumeAccess(seconds: number, reason = '') {
  return await cloudRequest<CloudAccountSummary & { message: string }>('/api/v1/access/consume', {
    method: 'POST',
    auth: true,
    body: {
      seconds,
      reason,
    },
  })
}

export function buildCloudAuthedUrl(path: string, query?: Record<string, string | number | boolean | null | undefined>) {
  const token = getCloudToken()
  return buildUrl(path, {
    ...(query || {}),
    token,
  })
}
