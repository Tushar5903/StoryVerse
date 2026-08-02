import { useEffect, useState } from 'react'
export function useApiResource(loader, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  useEffect(() => { let active = true; loader().then(data => active && setState({ data, loading: false, error: null })).catch(error => active && setState({ data: null, loading: false, error })); return () => { active = false } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)
  return state
}
