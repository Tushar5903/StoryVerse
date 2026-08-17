import { useEffect } from 'react'
import { getAuthor } from '../services/authorsApi'
import { getBook } from '../services/booksApi'

const APP_NAME = 'StoryVerse'

const withAppName = label => label ? `${label} | ${APP_NAME}` : APP_NAME

const titleForRoute = (pathname, search = '') => {
  if (pathname === '/') return APP_NAME
  if (pathname === '/explore' || pathname === '/search') return withAppName('Explore')
  if (pathname === '/login') return withAppName('Login')
  if (pathname === '/register') return withAppName('Register')
  if (pathname === '/forgot-password') return withAppName('Forgot Password')
  if (pathname === '/reset-password') return withAppName('Reset Password')
  if (pathname === '/genres') return withAppName('Genres')
  if (pathname === '/leaderboard') return withAppName('Leaderboard')
  if (pathname === '/profile') return withAppName('Profile')
  if (pathname === '/settings') return withAppName('Settings')
  if (pathname === '/reviews') return withAppName('My Reviews')
  if (pathname === '/bookmarks' || pathname === '/reader-dashboard') return withAppName('My Library')
  if (pathname === '/dashboard') return withAppName('Writer Dashboard')
  if (pathname === '/write' || pathname.startsWith('/chapters/')) return withAppName('Write')
  if (pathname === '/reader') return withAppName('Reader')
  if (pathname === '/authors') return withAppName('Authors')
  if (pathname === '/authors/create') return withAppName('Create Author')
  if (pathname.startsWith('/authors/')) return withAppName('Author')
  if (pathname.startsWith('/users/')) return withAppName('User Profile')
  if (pathname === '/books/new') return withAppName('New Book')
  if (pathname.startsWith('/books/')) {
    if (pathname.endsWith('/edit')) return withAppName('Edit Book')
    if (pathname.endsWith('/reviews')) return withAppName('Book Reviews')
    return withAppName('Book')
  }
  if (pathname === '/manuscript/configuration') return withAppName('Book Editor')
  if (pathname === '/admin' || pathname === '/admin/dashboard') return withAppName('Admin Dashboard')
  if (pathname === '/admin/analytics') return withAppName('Analytics')
  if (pathname === '/admin/content') return withAppName('Content')
  if (pathname === '/admin/users') return withAppName('Users')
  if (pathname === '/admin/authors') return withAppName('Author Panel')
  if (pathname.startsWith('/genre/') || pathname.startsWith('/explore/genre/')) {
    const genre = decodeURIComponent(pathname.split('/').pop() || '').replaceAll('-', ' ')
    return withAppName(genre ? `${genre[0].toUpperCase()}${genre.slice(1)}` : 'Genre')
  }
  if (search) return withAppName('Page')
  return withAppName('Page')
}

export default function DocumentTitle({ pathname, search }) {
  useEffect(() => {
    let active = true
    const fallback = titleForRoute(pathname, search)
    document.title = fallback

    const dynamicTitle = pathname.match(/^\/authors\/([^/]+)$/)
    if (dynamicTitle) {
      getAuthor(decodeURIComponent(dynamicTitle[1]))
        .then(author => {
          if (active && author?.name) document.title = withAppName(author.name)
        })
        .catch(() => {})
    }

    const dynamicBook = pathname.match(/^\/books\/(\d+)$/)
    if (dynamicBook) {
      getBook(decodeURIComponent(dynamicBook[1]))
        .then(book => {
          if (active && book?.title) document.title = withAppName(book.title)
        })
        .catch(() => {})
    }

    return () => { active = false }
  }, [pathname, search])

  return null
}
