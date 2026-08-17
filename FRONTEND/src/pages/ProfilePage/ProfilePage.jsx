import { useEffect, useState } from 'react'
import { getMe } from '../../services/usersApi'
import { listMyBooks } from '../../services/booksApi'
import { socialLinks } from '../../utils/socials'
import './ProfilePage.css'
export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [books, setBooks] = useState([]);
    const [error, setError] = useState('');
    const links = socialLinks(user);
    useEffect(() => {
        Promise.all([getMe(), listMyBooks('?size=20')])
            .then(([profile, page]) => {
                setUser(profile);
                setBooks(page.content || [])
            })
            .catch(e => setError(e.message))
    }, []);

    return <main className="profile-page">
        {error ? <div className="error-box">
            {error}
        </div> :
            <>
                <section className="profile-hero">
                    <div className="profile-avatar">
                        {user?.profileImage ?
                            <img src={user.profileImage} alt="" /> : (user?.name || user?.username || 'U').slice(0, 1)}
                    </div>
                    <div>
                        <div className="eyebrow">READER · WRITER</div>
                        <h1>{user?.name || 'Your profile'}</h1>
                        <p>@{user?.username || 'storyverse_reader'}</p>
                        <p>{user?.bio || 'A quiet reader in the StoryVerse archive.'}</p>
                        {links.length > 0 &&
                            <div className="profile-socials">
                                {links.map(link => {
                                    const Icon = link.icon;
                                    return <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer" title={link.label} aria-label={link.label}>
                                        <Icon size={15} /></a>
                                })}
                            </div>}
                        <div className="profile-stats"><span><strong>{books.length}</strong> Works</span></div>
                    </div>
                    <a className="button ghost" href="/settings">Edit profile</a>
                </section>
                <section className="profile-works">
                    <div className="eyebrow">THE AUTHOR'S SHELF</div>
                    <h2>Books written by this user</h2>
                    {books.length ?
                        <div className="profile-book-grid">{books.map(book => <a href={`/books/${book.id}`} className="profile-book" key={book.id}>
                            <div className="profile-cover">
                                {book.coverImage ? <img src={book.coverImage} alt="" /> : <span>SV</span>}
                            </div>
                            <h3>{book.title}</h3>
                            <p>{book.published ? 'Published' : 'Draft'}</p>
                        </a>)}</div>
                        :
                        <div className="profile-empty">Nothing published yet. Start writing a story to give this shelf its first spine.
                        </div>}
                </section>
            </>
        }
    </main>
}
