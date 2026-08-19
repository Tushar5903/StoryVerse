import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiArrowUpRight, FiEdit3, FiExternalLink, FiLogOut, FiShield, FiTrash2, FiUsers } from 'react-icons/fi'
import { getSuperAdminSession, updateUserRole, updateUserStatus, deleteUser, deleteAuthor, updateAuthor, deleteBook, getDashboard, listAllUsers, listAllAuthors, listAllBooks } from '../../services/superAdminApi'
import { clearSuperAuth } from '../../services/apiClient'
import ConfirmModal from '../../components/common/ConfirmModal/ConfirmModal'
import Pager from '../../components/common/Pager/Pager'
import './SuperAdminDashboardPage.css'

const ROLE_LABELS = { ADMIN: 'Admin', USER: 'User' }
const VERDICT_ROLES = { ADMIN: 'USER', USER: 'ADMIN' }
const PAGE_SIZE = 100

function Stat({ label, value }) {
    return <div className="sa-stat"><span>{label}</span><strong>{value}</strong></div>
}

function EmptyRow({ text }) {
    return <div className="sa-empty">{text}</div>
}

export default function SuperAdminDashboardPage() {
    const [session, setSession] = useState(null)
    const [tab, setTab] = useState('overview')
    const [stats, setStats] = useState(null)
    const [users, setUsers] = useState([])
    const [authors, setAuthors] = useState([])
    const [books, setBooks] = useState([])
    const [userBooks, setUserBooks] = useState([])
    const [pager, setPager] = useState({ page: 0, totalPages: 0, totalElements: 0 })
    const [loading, setLoading] = useState(true)
    const [pendingId, setPendingId] = useState(null)
    const [confirm, setConfirm] = useState(null)
    const [editingAuthor, setEditingAuthor] = useState(null)
    const [authorDraft, setAuthorDraft] = useState({})

    const refreshTab = useCallback(() => {
        const query = `?page=${pager.page}&size=${PAGE_SIZE}&sort=createdAt,desc`
        const setPage = page => {
            setPager({
                page: page.number ?? 0,
                totalPages: page.totalPages ?? 0,
                totalElements: page.totalElements ?? 0,
            })
        }
        if (tab === 'overview') {
            getDashboard().then(setStats).catch(() => setStats(null))
        } else if (tab === 'users') {
            listAllUsers(query).then(page => {
                setUsers(page.content || [])
                if ((page.content || []).length === 0 && (page.number || 0) > 0) setPager(prev => ({ ...prev, page: prev.page - 1 }))
                setPage(page)
                setLoading(false)
            }).catch(() => setLoading(false))
        } else if (tab === 'authors') {
            listAllAuthors(query).then(page => {
                setAuthors(page.content || [])
                if ((page.content || []).length === 0 && (page.number || 0) > 0) setPager(prev => ({ ...prev, page: prev.page - 1 }))
                setPage(page)
                setLoading(false)
            }).catch(() => setLoading(false))
        } else if (tab === 'books') {
            listAllBooks(query).then(page => {
                setBooks(page.content || [])
                if ((page.content || []).length === 0 && (page.number || 0) > 0) setPager(prev => ({ ...prev, page: prev.page - 1 }))
                setPage(page)
                setLoading(false)
            }).catch(() => setLoading(false))
        } else if (tab === 'userBooks') {
            listAllBooks(`${query}&createdByRole=USER`).then(page => {
                setUserBooks(page.content || [])
                if ((page.content || []).length === 0 && (page.number || 0) > 0) setPager(prev => ({ ...prev, page: prev.page - 1 }))
                setPage(page)
                setLoading(false)
            }).catch(() => setLoading(false))
        }
    }, [tab, pager.page])

    const switchTab = key => {
        setTab(key)
        setPager({ page: 0, totalPages: 0, totalElements: 0 })
        setLoading(true)
    }

    const goToPage = page => {
        setPager(prev => ({ ...prev, page }))
        setLoading(true)
    }

    useEffect(() => {
        getSuperAdminSession().then(setSession).catch(() => {})
        refreshTab()
    }, [refreshTab])

    const run = async (action, message, id = 'sys') => {
        setPendingId(id)
        try {
            await action()
            toast.success(message)
            refreshTab()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setPendingId(null)
            setConfirm(null)
        }
    }

    const toggleRole = user => run(() => updateUserRole(user.id, VERDICT_ROLES[user.role]), `${user.username || user.email} is now ${ROLE_LABELS[VERDICT_ROLES[user.role]]}`, user.id)
    const toggleBan = user => run(() => updateUserStatus(user.id, !user.banned), user.banned ? `${user.username || user.email} unbanned` : `${user.username || user.email} banned`, user.id)
    const handleDeleteUser = () => run(() => deleteUser(confirm.id), `User ${confirm.id} deleted`, 'sys')
    const handleDeleteAuthor = () => run(() => deleteAuthor(confirm.id), `Author ${confirm.id} deleted`, 'sys')
    const handleDeleteBook = () => run(() => deleteBook(confirm.id), `Book ${confirm.id} deleted`, 'sys')
    const handleSaveAuthor = () => {
        const { id } = editingAuthor
        run(async () => {
            await updateAuthor(id, {
                name: authorDraft.name,
                profileImage: authorDraft.profileImage || null,
                dateOfBirth: authorDraft.dateOfBirth || null,
                placeOfBirth: authorDraft.placeOfBirth || null,
                biography: authorDraft.biography || null,
            })
            setEditingAuthor(null)
        }, 'Author updated', id)
    }

    const logout = () => { clearSuperAuth(); window.location.replace('/super-admin/login') }

    return <div className="sa-page">
        <header className="sa-header">
            <div className="sa-header-brand"><FiShield /> SUPER ADMIN <span>CONSOLE</span></div>
            <div className="sa-header-right">
                {session && <span className="sa-session">{session.email}</span>}
                <button className="sa-logout" onClick={logout}><FiLogOut /> Sign out</button>
                <Link className="sa-exit" to="/"><FiExternalLink /> Site</Link>
            </div>
        </header>
        <nav className="sa-tabs">
            {[['overview', 'Overview'], ['users', 'Users'], ['authors', 'Authors'], ['books', 'Books'], ['userBooks', 'User Books']].map(([key, label]) => (
                <button key={key} className={tab === key ? 'active' : ''} onClick={() => switchTab(key)}>{label}</button>
            ))}
        </nav>
        <main className="sa-main">
            {tab === 'overview' && <section className="sa-overview">
                <h2>Archive overview</h2>
                {stats ? <div className="sa-stats"><Stat label="Total users" value={stats.users ?? '—'} /><Stat label="Total books" value={stats.books ?? '—'} /><Stat label="Total reviews" value={stats.reviews ?? '—'} /></div> : <EmptyRow text="Loading overview…" />}
                <p className="sa-hint">Use the tabs above to manage accounts and content. Destructive actions ask for confirmation.</p>
            </section>}
            {tab === 'users' && <section className="sa-list-section">
                <div className="sa-list-head"><h2>Users <FiUsers /></h2><span>{users.length} shown · page {pager.totalPages ? pager.page + 1 : 0}/{pager.totalPages || 0}</span></div>
                {loading ? <EmptyRow text="Loading users…" /> : users.length ? <div className="sa-table">
                    <div className="sa-row sa-row--head"><span>User</span><span>Role</span><span>Status</span><span className="sa-actions-col">Actions</span></div>
                    {users.map(user => <div className="sa-row" key={user.id}>
                        <span className="sa-user-cell"><strong>{user.name}</strong><small>@{user.username} · {user.email}</small></span>
                        <span className={`sa-role sa-role--${(user.role || '').toLowerCase()}`}>{ROLE_LABELS[user.role] || user.role}</span>
                        <span className="sa-status">
                            <i className={user.enabled && !user.banned ? 'sa-dot sa-dot--ok' : 'sa-dot sa-dot--bad'} />
                            {user.banned ? 'Banned' : user.enabled ? 'Active' : 'Disabled'}
                        </span>
                        <span className="sa-actions-col">
                            <button className="sa-btn" disabled={pendingId === user.id} onClick={() => toggleRole(user)}>{user.role === 'ADMIN' ? 'Demote' : 'Promote'}</button>
                            <button className="sa-btn" disabled={pendingId === user.id} onClick={() => toggleBan(user)}>{user.banned ? 'Unban' : 'Ban'}</button>
                            <button className="sa-btn sa-btn--danger" disabled={pendingId === user.id} onClick={() => setConfirm({ type: 'user', id: user.id, label: `${user.name} (@${user.username})` })}><FiTrash2 /> Delete</button>
                        </span>
                    </div>)}
                </div> : <EmptyRow text="No users found." />}
                <Pager {...pager} onPage={goToPage} />
            </section>}
            {tab === 'authors' && <section className="sa-list-section">
                <div className="sa-list-head"><h2>Authors</h2><span>{authors.length} shown · page {pager.totalPages ? pager.page + 1 : 0}/{pager.totalPages || 0}</span></div>
                {loading ? <EmptyRow text="Loading authors…" /> : authors.length ? <div className="sa-table">
                    <div className="sa-row sa-row--head"><span>Author</span><span>Type</span><span>Books</span><span className="sa-actions-col">Actions</span></div>
                    {authors.map(author => <div className="sa-row" key={author.id}>
                        <span className="sa-user-cell"><strong>{author.name}</strong><small>{author.userId ? `Writer profile @${author.username}` : 'Standalone profile'}</small></span>
                        <span className="sa-role sa-role--author">{author.authorType === 'ADMIN' ? 'Standalone' : 'User-linked'}</span>
                        <span><Link className="sa-link" to={`/authors/${author.id}`}>View <FiArrowUpRight /></Link></span>
                        <span className="sa-actions-col">
                            <button className="sa-btn" disabled={pendingId === author.id} onClick={() => { setEditingAuthor(author); setAuthorDraft({ name: author.name || '', profileImage: author.profileImage || '', dateOfBirth: author.dateOfBirth || '', placeOfBirth: author.placeOfBirth || '', biography: author.biography || '' }) }}><FiEdit3 /> Edit</button>
                            <button className="sa-btn sa-btn--danger" disabled={pendingId === author.id} onClick={() => setConfirm({ type: 'author', id: author.id, label: author.name })}><FiTrash2 /> Delete</button>
                        </span>
                    </div>)}
                </div> : <EmptyRow text="No authors found." />}
                <Pager {...pager} onPage={goToPage} />
            </section>}
            {tab === 'books' && <section className="sa-list-section">
                <div className="sa-list-head"><h2>Books</h2><span>{books.length} shown · page {pager.totalPages ? pager.page + 1 : 0}/{pager.totalPages || 0}</span></div>
                {loading ? <EmptyRow text="Loading books…" /> : books.length ? <div className="sa-table">
                    <div className="sa-row sa-row--head"><span>Book</span><span>Type</span><span>Status</span><span className="sa-actions-col">Actions</span></div>
                    {books.map(book => <div className="sa-row" key={book.id}>
                        <span className="sa-user-cell"><strong>{book.title}</strong><small>{book.authorName || 'Unknown author'} · {book.id}</small></span>
                        <span className="sa-role sa-role--book">{book.bookType === 'REVIEW_BOOK' ? 'Review' : 'User story'}</span>
                        <span className="sa-status"><i className={book.published ? 'sa-dot sa-dot--ok' : 'sa-dot sa-dot--bad'} />{book.published ? 'Published' : 'Draft'}</span>
                        <span className="sa-actions-col">
                            <Link className="sa-btn sa-btn--link" to={`/books/${book.id}`}>View <FiArrowUpRight /></Link>
                            <button className="sa-btn sa-btn--danger" disabled={pendingId === book.id} onClick={() => setConfirm({ type: 'book', id: book.id, label: book.title })}><FiTrash2 /> Delete</button>
                        </span>
                    </div>)}
                </div> : <EmptyRow text="No books found." />}
                <Pager {...pager} onPage={goToPage} />
            </section>}
            {tab === 'userBooks' && <section className="sa-list-section">
                <div className="sa-list-head"><h2>User Books</h2><span>{userBooks.length} shown · page {pager.totalPages ? pager.page + 1 : 0}/{pager.totalPages || 0}</span></div>
                {loading ? <EmptyRow text="Loading user books…" /> : userBooks.length ? <div className="sa-table">
                    <div className="sa-row sa-row--head"><span>Book</span><span>Type</span><span>Status</span><span className="sa-actions-col">Actions</span></div>
                    {userBooks.map(book => <div className="sa-row" key={book.id}>
                        <span className="sa-user-cell"><strong>{book.title}</strong><small>{book.authorName || 'Unknown author'} · {book.id}</small></span>
                        <span className="sa-role sa-role--book">User story</span>
                        <span className="sa-status"><i className={book.published ? 'sa-dot sa-dot--ok' : 'sa-dot sa-dot--bad'} />{book.published ? 'Published' : 'Draft'}</span>
                        <span className="sa-actions-col">
                            <Link className="sa-btn sa-btn--link" to={`/books/${book.id}`}>View <FiArrowUpRight /></Link>
                            <button className="sa-btn sa-btn--danger" disabled={pendingId === book.id} onClick={() => setConfirm({ type: 'book', id: book.id, label: book.title })}><FiTrash2 /> Delete</button>
                        </span>
                    </div>)}
                </div> : <EmptyRow text="No user books found." />}
                <Pager {...pager} onPage={goToPage} />
            </section>}
        </main>

        {confirm && <ConfirmModal
            title={`Delete ${confirm.type}?`}
            message={`This permanently deletes "${confirm.label}" together with everything linked to it. This cannot be undone.`}
            confirmLabel="Delete"
            pending={pendingId === 'sys'}
            onConfirm={confirm.type === 'user' ? handleDeleteUser : confirm.type === 'author' ? handleDeleteAuthor : handleDeleteBook}
            onCancel={() => setConfirm(null)}
        />}
        {editingAuthor && <div className="confirm-overlay" onClick={() => setEditingAuthor(null)}>
            <div className="sa-edit-modal" onClick={event => event.stopPropagation()}>
                <h3>Edit author <FiEdit3 /></h3>
                <label>Name<input value={authorDraft.name || ''} onChange={e => setAuthorDraft({ ...authorDraft, name: e.target.value })} /></label>
                <label>Profile image URL<input value={authorDraft.profileImage || ''} onChange={e => setAuthorDraft({ ...authorDraft, profileImage: e.target.value })} /></label>
                <label>Place of birth<input value={authorDraft.placeOfBirth || ''} onChange={e => setAuthorDraft({ ...authorDraft, placeOfBirth: e.target.value })} /></label>
                <label>Biography<textarea rows="5" value={authorDraft.biography || ''} onChange={e => setAuthorDraft({ ...authorDraft, biography: e.target.value })} /></label>
                <div className="confirm-actions">
                    <button className="confirm-cancel" onClick={() => setEditingAuthor(null)} disabled={pendingId === 'sys'}>Cancel</button>
                    <button className="confirm-danger" onClick={handleSaveAuthor} disabled={pendingId === 'sys' || !authorDraft.name}>{pendingId === 'sys' ? 'Saving…' : 'Save changes'}</button>
                </div>
            </div>
        </div>}
    </div>
}