/// <reference types="vite/client" />

interface TelegramWebApp {
  ready: () => void
  expand?: () => void
  close?: () => void
  initData?: string
  initDataUnsafe?: Record<string, unknown>
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}
