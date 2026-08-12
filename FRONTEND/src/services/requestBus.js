let pending = 0
const listeners = new Set()

function notify() {
  listeners.forEach(listener => listener())
}

export const requestBus = {
  start() {
    pending += 1
    notify()
  },
  end() {
    pending = Math.max(0, pending - 1)
    notify()
  },
  isPending: () => pending > 0,
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}