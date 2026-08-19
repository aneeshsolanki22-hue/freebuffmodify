/**
 * Local-only session lifecycle.
 *
 * This fork has no freebuff.com session server (quota, admission, model
 * locking). `useFreebuffSession` synthesizes a permanent active session so
 * the send gates (`holdsLiveFreebuffSlot` / `getFreebuffInstanceId`) pass
 * locally. The imperative session functions are kept as no-op stubs so their
 * many call sites (slash commands, banners, landing screen) compile and stay
 * harmless; none of the server-backed quota machinery exists anymore.
 */

import { useEffect } from 'react'

import {
  getSelectedFreebuffModel,
  useFreebuffModelStore,
} from '../state/freebuff-model-store'
import { useFreebuffSessionStore } from '../state/freebuff-session-store'
import { IS_FREEBUFF } from '../utils/constants'
import { holdsLiveFreebuffSlot } from '../utils/freebuff-session-api'
import { saveFreebuffModelPreference } from '../utils/settings'

import type { FreebuffSessionResponse } from '../types/freebuff-session'

/** Read the current instance id for outgoing chat requests. Always present
 *  while the synthesized local session is active. */
export function getFreebuffInstanceId(): string | undefined {
  const current = useFreebuffSessionStore.getState().session
  if (!current || !holdsLiveFreebuffSlot(current)) return undefined
  return 'instanceId' in current ? current.instanceId : undefined
}

export function refreshFreebuffSession(
  _opts: { resetChat?: boolean } = {},
): Promise<void> {
  return Promise.resolve()
}

export function returnToFreebuffLanding(
  _opts: { resetChat?: boolean } = {},
): Promise<void> {
  return Promise.resolve()
}

export function refreshFreebuffLandingMetadata(): Promise<void> {
  return Promise.resolve()
}

export function startFreebuffSession(model: string): Promise<void> {
  if (!IS_FREEBUFF) return Promise.resolve()
  useFreebuffModelStore.getState().setSelectedModel(model)
  saveFreebuffModelPreference(model)
  return Promise.resolve()
}

export function takeOverFreebuffSession(): Promise<void> {
  return Promise.resolve()
}

export function markFreebuffSessionSuperseded(): void {}

export function markFreebuffSessionCountryBlocked(_params: {
  countryCode: string
  countryBlockReason?: string
  ipPrivacySignals?: unknown[]
}): void {}

export function markFreebuffSessionEnded(): void {}

interface UseFreebuffSessionResult {
  session: FreebuffSessionResponse | null
  failure: ReturnType<typeof useFreebuffSessionStore.getState>['failure']
}

export function useFreebuffSession(): UseFreebuffSessionResult {
  const session = useFreebuffSessionStore((s) => s.session)
  const failure = useFreebuffSessionStore((s) => s.failure)

  useEffect(() => {
    const { setSession, setFailure } = useFreebuffSessionStore.getState()

    if (!IS_FREEBUFF) {
      // Non-freebuff (Codebuff) builds never gate on a free session; leave the
      // store empty (app.tsx's session routing is all behind IS_FREEBUFF).
      setSession(null)
      return
    }

    // ponytail: no freebuff.com session server in this fork — synthesize a
    // permanent local session so the send gates pass without network or
    // quota. Revisit if server-backed sessions are ever re-added.
    const start = new Date()
    setSession({
      status: 'active',
      accessTier: 'full',
      instanceId: `local-${process.pid}`,
      model: getSelectedFreebuffModel(),
      admittedAt: start.toISOString(),
      expiresAt: new Date(start.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      remainingMs: 24 * 60 * 60 * 1000,
    })
    setFailure(null)
  }, [])

  return { session, failure }
}
