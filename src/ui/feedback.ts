import Vue from 'vue'

type ToastType = 'info' | 'success' | 'warning' | 'error'
type DialogKind = 'alert' | 'confirm' | 'prompt'

type ToastInput = string | {
  message: string
  duration?: number
  showClose?: boolean
}

interface ToastRecord {
  id: number
  type: ToastType
  message: string
  showClose: boolean
}

interface DialogRecord {
  kind: DialogKind
  title: string
  message: string
  inputValue: string
  confirmText: string
  cancelText: string
  resolve: (value: unknown) => void
}

const toastState = Vue.observable({
  items: [] as ToastRecord[],
})

const dialogState = Vue.observable({
  visible: false,
  kind: 'alert' as DialogKind,
  title: '',
  message: '',
  inputValue: '',
  confirmText: '确认',
  cancelText: '取消',
})

let seed = 1
let activeDialog: DialogRecord | null = null
const dialogQueue: DialogRecord[] = []

function normalizeInput(input: ToastInput) {
  if (typeof input === 'string') {
    return {
      message: input,
      duration: 2400,
      showClose: false,
    }
  }

  return {
    message: input.message,
    duration: input.duration ?? 2400,
    showClose: input.showClose ?? Boolean(input.duration === 0),
  }
}

function removeToast(id: number) {
  const index = toastState.items.findIndex((item) => item.id === id)
  if (index >= 0) {
    toastState.items.splice(index, 1)
  }
}

function createToast(type: ToastType, input: ToastInput) {
  const options = normalizeInput(input)
  const id = seed++
  const item = Vue.observable({
    id,
    type,
    message: options.message,
    showClose: options.showClose,
  }) as ToastRecord

  toastState.items.push(item)

  if (options.duration !== 0) {
    window.setTimeout(() => removeToast(id), options.duration)
  }

  return {
    close: () => removeToast(id),
    get message() {
      return item.message
    },
    set message(value: string) {
      item.message = value
    },
  }
}

function pickMessage(input: unknown) {
  if (typeof input === 'string') {
    return input
  }

  if (input && typeof input === 'object' && 'message' in (input as Record<string, unknown>)) {
    return String((input as Record<string, unknown>).message ?? '')
  }

  return String(input ?? '')
}

function pickTitle(input: unknown, fallback: string) {
  if (input && typeof input === 'object' && 'title' in (input as Record<string, unknown>)) {
    return String((input as Record<string, unknown>).title ?? fallback)
  }
  return fallback
}

function syncDialogState(record: DialogRecord | null) {
  dialogState.visible = Boolean(record)
  dialogState.kind = record?.kind ?? 'alert'
  dialogState.title = record?.title ?? ''
  dialogState.message = record?.message ?? ''
  dialogState.inputValue = record?.inputValue ?? ''
  dialogState.confirmText = record?.confirmText ?? '确认'
  dialogState.cancelText = record?.cancelText ?? '取消'
}

function openNextDialog() {
  if (activeDialog || dialogQueue.length === 0) {
    return
  }
  activeDialog = dialogQueue.shift() || null
  syncDialogState(activeDialog)
}

function enqueueDialog(record: Omit<DialogRecord, 'resolve'>) {
  return new Promise((resolve) => {
    dialogQueue.push({
      ...record,
      resolve,
    })
    openNextDialog()
  })
}

function settleDialog(payload: unknown) {
  const current = activeDialog
  activeDialog = null
  syncDialogState(null)
  if (current) {
    current.resolve(payload)
  }
  window.setTimeout(() => openNextDialog(), 0)
}

export function confirmDialog() {
  if (!activeDialog) {
    return
  }
  if (activeDialog.kind === 'prompt') {
    settleDialog({
      action: 'confirm',
      value: dialogState.inputValue,
    })
    return
  }
  settleDialog('confirm')
}

export function cancelDialog() {
  if (!activeDialog) {
    return
  }
  if (activeDialog.kind === 'alert') {
    settleDialog('confirm')
    return
  }
  if (activeDialog.kind === 'prompt') {
    settleDialog({
      action: 'cancel',
      value: activeDialog.inputValue,
    })
    return
  }
  settleDialog('cancel')
}

export function updateDialogInput(value: string) {
  dialogState.inputValue = value
}

export const message = {
  info(input: ToastInput) {
    return createToast('info', input)
  },
  success(input: ToastInput) {
    return createToast('success', input)
  },
  warning(input: ToastInput) {
    return createToast('warning', input)
  },
  error(input: ToastInput) {
    return createToast('error', input)
  },
}

export async function alertBox(input: unknown) {
  return enqueueDialog({
    kind: 'alert',
    title: pickTitle(input, '提示'),
    message: pickMessage(input),
    inputValue: '',
    confirmText: '知道了',
    cancelText: '取消',
  }) as Promise<'confirm'>
}

export async function confirmBox(input: unknown) {
  return enqueueDialog({
    kind: 'confirm',
    title: pickTitle(input, '请确认'),
    message: pickMessage(input),
    inputValue: '',
    confirmText: '确认',
    cancelText: '取消',
  }) as Promise<'confirm' | 'cancel'>
}

export async function promptBox(messageText: string, title?: string, options?: { inputValue?: string }) {
  return enqueueDialog({
    kind: 'prompt',
    title: title || '请输入',
    message: messageText,
    inputValue: options?.inputValue ?? '',
    confirmText: '确认',
    cancelText: '取消',
  }) as Promise<{ value: string; action: 'confirm' | 'cancel' }>
}

export const feedbackPlugin = {
  install(VueCtor: typeof Vue) {
    VueCtor.prototype.$message = message
    VueCtor.prototype.$alert = alertBox
    VueCtor.prototype.$msgbox = alertBox
    VueCtor.prototype.$confirm = confirmBox
    VueCtor.prototype.$prompt = promptBox
  },
}

export function useToastState() {
  return toastState
}

export function useDialogState() {
  return dialogState
}
