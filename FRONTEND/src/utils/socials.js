import { FiInstagram, FiTwitter, FiYoutube } from 'react-icons/fi'

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: FiInstagram, pattern: 'https://instagram.com/' },
  { key: 'twitter', label: 'X / Twitter', icon: FiTwitter, pattern: 'https://x.com/' },
  { key: 'youtube', label: 'YouTube', icon: FiYoutube, pattern: '' },
]

export function socialLinks(user) {
  if (!user) return []
  return PLATFORMS.map(platform => {
    const handle = user[platform.key]
    if (!handle) return null
    const value = handle.trim().replace(/^@/, '')
    return { ...platform, href: /^https?:\/\//.test(value) ? value : platform.pattern + value }
  }).filter(Boolean)
}
