import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { store } from './store/store'
import GlobalLoader from './components/common/GlobalLoader/GlobalLoader'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter><Provider store={store}><App /><GlobalLoader /><ToastContainer position="bottom-right" autoClose={3000} theme="dark" /></Provider></BrowserRouter>
  </StrictMode>,
)
