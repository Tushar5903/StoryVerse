import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_PAGE_SIZE = 20

export default function useInfiniteScroll({ fetchPage, enabled = true, pageSize = DEFAULT_PAGE_SIZE, resetKey = '' }) {
  const [session, setSession] = useState({
    key: resetKey,
    items: [],
    page: 0,
    initialLoading: true,
    loadingMore: false,
    hasMore: true,
    error: '',
    totalElements: null,
  })

  if (session.key !== resetKey) {
    setSession({ key: resetKey, items: [], page: 0, initialLoading: true, loadingMore: false, hasMore: true, error: '', totalElements: null })
  }

  const sentinelRef = useRef(null)
  const fetchRef = useRef(fetchPage)
  const stateRef = useRef({ page: 0, loading: false, hasMore: true, controller: null })
  useEffect(() => {
    fetchRef.current = fetchPage
  })

  const requestPage = useCallback((next, { initial = false } = {}) => {
    const state = stateRef.current
    if (state.loading || !state.hasMore) return
    const key = resetKey
    state.loading = true
    state.controller?.abort()
    const controller = new AbortController()
    state.controller = controller
    setSession(prev => prev.key === key
      ? { ...prev, error: '', ...(initial ? { initialLoading: true } : { loadingMore: true }) }
      : prev)
    Promise.resolve(fetchRef.current(next, pageSize, controller.signal))
      .then(pageData => {
        if (controller.signal.aborted) return
        const batch = Array.isArray(pageData) ? pageData : (pageData?.content || [])
        const nextPage = next + 1
        state.loading = false
        state.page = nextPage
        state.hasMore = Array.isArray(pageData)
          ? batch.length >= pageSize
          : pageData.last !== true && (pageData.totalPages == null || nextPage < pageData.totalPages)
        setSession(prev => prev.key === key
          ? {
              ...prev,
              items: [...prev.items, ...batch],
              page: nextPage,
              hasMore: state.hasMore,
              totalElements: Array.isArray(pageData) ? prev.totalElements : (pageData?.totalElements ?? prev.totalElements),
              initialLoading: false,
              loadingMore: false,
            }
          : prev)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        state.loading = false
        setSession(prev => prev.key === key
          ? { ...prev, initialLoading: false, loadingMore: false, error: 'Failed to load more cards. Please try again.' }
          : prev)
      })
  }, [pageSize, resetKey])

  useEffect(() => {
    if (!enabled) return undefined
    const state = stateRef.current
    state.controller?.abort()
    state.loading = false
    state.page = 0
    state.hasMore = true
    requestPage(0, { initial: true })
    return () => state.controller?.abort()
  }, [enabled, resetKey, requestPage])

  useEffect(() => {
    if (!enabled) return undefined
    const element = sentinelRef.current
    if (!element) return undefined
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) requestPage(stateRef.current.page)
    }, { rootMargin: '300px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [enabled, resetKey, requestPage, session.initialLoading])

  return {
    items: session.items,
    page: session.page,
    initialLoading: session.initialLoading,
    loadingMore: session.loadingMore,
    hasMore: session.hasMore,
    error: session.error,
    totalElements: session.totalElements,
    sentinelRef,
  }
}