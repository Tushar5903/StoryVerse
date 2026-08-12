import { useSyncExternalStore } from 'react'
import { requestBus } from '../../../services/requestBus'
import './GlobalLoader.css'

export default function GlobalLoader() {
  const pending = useSyncExternalStore(requestBus.subscribe, requestBus.isPending)
  if (!pending) return null
  return <div className="sv-global-loader" role="status" aria-label="Loading"><span /></div>
}