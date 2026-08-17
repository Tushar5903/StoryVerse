import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiArrowUpRight, FiEye, FiEyeOff } from 'react-icons/fi'
import { login } from '../../services/authApi'
import PosterGallery from '../../components/common/PosterGallery/PosterGallery'
import './LoginPage.css'
export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);
    const submit = async event => {
        event.preventDefault();
        setError('');
        setPending(true);
        try {
            const result = await login({ email, password });
            toast.success(`Welcome back, ${result?.name || 'reader'}!`);
            navigate('/')
        } catch (err) {
            setError(err.message);
            toast.error(err.message)
        } finally {
            setPending(false)
        }
    };

    return <div className="login-page">
        <div className="login-art">
            <PosterGallery />
            <div className="login-overlay" />
            <a className="brand" href="/">STORY<span>VERSE</span></a>
            <div className="login-copy">
                <div className="eyebrow">THE DIGITAL LITERARY ARCHIVE</div>
                <h1>Stories worth <em>staying up for.</em></h1>
            </div>
        </div>
        <div className="login-panel">
            <a className="mobile-brand" href="/">STORY<span>VERSE</span></a>
            <div className="eyebrow">WELCOME BACK</div>
            <h2>Log in to StoryVerse</h2>
            <form onSubmit={submit}>
                {error && <div className="login-error">{error}</div>}
                <label>
                    Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" />
                </label>
                <label>
                    Password<div className="password-field">
                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password" />
                        <button type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </div>
                </label>
                <button className="button" disabled={pending}>{pending ? 'Logging in…' : 'Log in'} <FiArrowUpRight /></button>
            </form>
            <p className="login-links">
                <a href="/forgot-password">Forgot password?</a>
                <br /><br />
                Don't have an account?
                <a href="/register">Register</a>
            </p>
        </div>
    </div>
}
