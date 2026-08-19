import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiArrowUpRight, FiEye, FiEyeOff, FiShield } from 'react-icons/fi'
import { superAdminLogin } from '../../services/superAdminApi'
import { saveSuperAuth } from '../../services/apiClient'
import './SuperAdminLoginPage.css'
export default function SuperAdminLoginPage() {
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
            const result = await superAdminLogin({ email, password });
            saveSuperAuth(result);
            toast.success('Super admin session started');
            navigate('/super-admin')
        } catch (err) {
            setError(err.message);
            toast.error(err.message)
        } finally {
            setPending(false)
        }
    };

    return <div className="sa-login-page">
        <div className="sa-login-panel">
            <div className="sa-login-mark"><FiShield /></div>
            <div className="eyebrow">PRIVILEGED ACCESS</div>
            <h1>Super Admin Console</h1>
            <p className="sa-login-note">Authenticate with the platform credentials to manage accounts and content. This session lasts as long as your access token.</p>
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
                <button className="button" disabled={pending}>{pending ? 'Authenticating…' : 'Enter console'} <FiArrowUpRight /></button>
            </form>
            <p className="sa-login-links"><Link to="/">Back to StoryVerse</Link></p>
        </div>
    </div>
}
