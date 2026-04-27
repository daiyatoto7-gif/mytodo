'use client'

import { useEffect, useState, useCallback } from 'react'
import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase/client'
import { saveFCMToken } from '@/app/actions/notifications'

export type NotificationState = 'unsupported' | 'default' | 'granted' | 'denied' | 'loading'

export function useNotification() {
  const [state, setState] = useState<NotificationState>('loading')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState('unsupported')
      return
    }
    setState(Notification.permission as NotificationState)
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    if (!('Notification' in window)) return false

    setState('loading')
    try {
      const permission = await Notification.requestPermission()
      setState(permission as NotificationState)

      if (permission === 'granted') {
        await registerTokenWithRetry()
        return true
      }
      return false
    } catch {
      setState(Notification.permission as NotificationState)
      return false
    }
  }, [])

  return { state, requestPermission }
}

async function registerTokenWithRetry(retries = 2): Promise<void> {
  for (let i = 0; i <= retries; i++) {
    try {
      await registerToken()
      return
    } catch (err) {
      if (i === retries) console.warn('FCM token registration failed:', err)
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

async function registerToken(): Promise<void> {
  const messaging = await getFirebaseMessaging()
  if (!messaging) return

  // In production: use next-pwa's sw.js (includes worker/index.js push handlers)
  // In development (next-pwa disabled): fall back to firebase-messaging-sw.js
  let swReg: ServiceWorkerRegistration | undefined

  try {
    // Prefer the already-active SW (next-pwa's sw.js in production)
    swReg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 3000)),
    ])
  } catch {
    // SW not available
  }

  // Fallback: register firebase-messaging-sw.js explicitly (dev mode or iOS)
  if (!swReg) {
    try {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      })
    } catch {
      // SW registration failed - skip FCM token
      return
    }
  }

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: swReg,
  })

  if (token) {
    await saveFCMToken(token)
  }
}
