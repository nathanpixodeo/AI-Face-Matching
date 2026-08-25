import { Route, Routes } from 'react-router-dom'
import { RequireAdmin } from './components/RequireAdmin'
import { Login } from './pages/Login'
import { PlatformConsole } from './pages/PlatformConsole'

export function App() {
  return <Routes><Route path="/login" element={<Login />} /><Route path="/*" element={<RequireAdmin><PlatformConsole /></RequireAdmin>} /></Routes>
}
