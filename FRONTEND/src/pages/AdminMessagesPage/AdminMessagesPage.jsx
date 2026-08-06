import { useEffect, useState } from 'react'
import { listMessages } from '../../services/adminApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import './AdminMessagesPage.css'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listMessages('?size=100&sort=createdAt,desc')
      .then(page => { setMessages(page.content || []); setError('') })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return <>
    <SharedNav />
    <main className="admin-messages">
      <div className="admin-messages-head">
        <div>
          <div className="eyebrow">ADMIN INBOX</div>
          <h1>Messages.</h1>
          <p>What the readers are telling the archive — questions, corrections, and collaboration ideas.</p>
        </div>
        <span className="admin-messages-count">{messages.length} message{messages.length === 1 ? '' : 's'}</span>
      </div>

      {error && <div className="error-box">{error}</div>}

      <section className="aa-directory">
        <div className="eyebrow">THE ARCHIVE</div>
        <h2>All messages</h2>
        {loading ? <div className="aa-empty">Loading the inbox…</div>
          : !messages.length ? <div className="aa-empty"><strong>The inbox is empty.</strong><p>Contact messages submitted on the site will land here.</p></div>
            : <div className="am-grid">{messages.map(message => <article className="am-card" key={message.id}>
                <div className="am-top">
                  <span className="am-avatar">{(message.name || '?').slice(0, 1)}</span>
                  <div className="am-sender">
                    <h3>{message.name}</h3>
                    <a href={`mailto:${message.email}`}>{message.email}</a>
                  </div>
                  <time>{formatDate(message.createdAt)}</time>
                </div>
                <h4>{message.subject || 'General inquiry'}</h4>
                <p>{message.message}</p>
              </article>)}
            </div>}
      </section>
    </main>
    <Footer />
  </>
}
