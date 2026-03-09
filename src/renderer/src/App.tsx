import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/common/Layout'
import { Dashboard } from './pages/Dashboard'
import { Sessions } from './pages/Sessions'
import { Chat } from './pages/Chat'
import { Approvals } from './pages/Approvals'
import { Terminal } from './pages/Terminal'
import { Channels } from './pages/Channels'
import { CronJobs } from './pages/CronJobs'
import { Vault } from './pages/Vault'
import { Audit } from './pages/Audit'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/cron" element={<CronJobs />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
