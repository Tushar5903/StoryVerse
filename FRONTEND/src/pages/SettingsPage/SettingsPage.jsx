import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { getMe, updateMe } from '../../services/usersApi'
import { setUser } from '../../store/authSlice'
import './SettingsPage.css'

const emptyForm = { name: '', bio: '', dateOfBirth: '', instagram: '', twitter: '', youtube: '' }

export default function SettingsPage() {
  const dispatch = useDispatch()
  const [form, setForm] = useState(emptyForm)
  const [savedForm, setSavedForm] = useState(emptyForm)
  const [profileImage, setProfileImage] = useState('')
  const [image, setImage] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    getMe().then(user => {
      const value = {
        name: user.name || '',
        bio: user.bio || '',
        dateOfBirth: user.dateOfBirth || '',
        instagram: user.instagram || '',
        twitter: user.twitter || '',
        youtube: user.youtube || '',
      }
      setForm(value)
      setSavedForm(value)
      setProfileImage(user.profileImage || '')
    }).catch(e => setMessage(e.message))
  }, [])

  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value }))

  const save = async event => {
    event.preventDefault()
    try {
      const updated = await updateMe(form, image)
      dispatch(setUser(updated))
      setSavedForm(form)
      setProfileImage(updated.profileImage || profileImage)
      setImage(null)
      setMessage('Changes saved.')
    } catch (e) {
      setMessage(e.message)
    }
  }

  const cancel = () => {
    setForm(savedForm)
    setImage(null)
    setMessage('Changes cancelled.')
  }

  return <main className="settings-page">
    <div className="eyebrow">ACCOUNT SETTINGS</div>
    <h1>Edit your profile.</h1>
    <form onSubmit={save}>
      <div className="settings-photo">
        <div className="profile-avatar">{image ? <img src={URL.createObjectURL(image)} alt="" /> : profileImage ? <img src={profileImage} alt="" /> : <span>SV</span>}</div>
        <label>Upload new photo<input type="file" accept="image/*" onChange={event => setImage(event.target.files?.[0] || null)} /></label>
      </div>
      <label>Full name<input value={form.name} onChange={set('name')} /></label>
      <label>Date of birth <small>Private — this will not be shown publicly.</small><input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} /></label>
      <label>Bio<textarea rows="5" value={form.bio} onChange={set('bio')} /></label>
      <div className="social-grid">
        <label>Instagram<input placeholder="@username" value={form.instagram} onChange={set('instagram')} /></label>
        <label>X / Twitter<input placeholder="@username" value={form.twitter} onChange={set('twitter')} /></label>
        <label>YouTube<input placeholder="Channel URL" value={form.youtube} onChange={set('youtube')} /></label>
      </div>
      <div className="settings-actions">
        <button className="button ghost" type="button" onClick={cancel}>Cancel changes</button>
        <button className="button" type="submit">Save changes</button>
      </div>
      {message && <p className="settings-message">{message}</p>}
    </form>
  </main>
}
