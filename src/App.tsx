import { useState } from 'react'
import { MainLayout } from '@/pages/_layout'
import { Dashboard } from '@/pages/dashboard'
import { Chat } from '@/pages/chat'
import { Health } from '@/pages/health'
import { Landing } from '@/pages/landing'
import { Login } from '@/pages/login'
import { Signup } from '@/pages/signup'
import AdminConfig from '@/pages/AdminConfig'

export type Page = 'home' | 'dashboard' | 'chat' | 'health' | 'admin' | 'login' | 'signup'

export default function App() {
  const [page, setPage] = useState<Page>('home')

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <Landing />
      case 'dashboard':
        return <Dashboard />
      case 'chat':
        return <Chat />
      case 'health':
        return <Health />
      case 'admin':
        return <AdminConfig />
      case 'login':
        return <Login onSignupClick={() => setPage('signup')} />
      case 'signup':
        return <Signup onLoginClick={() => setPage('login')} />
      default:
        return <Landing />
    }
  }

  // Don't show the main layout for auth pages
  if (page === 'login' || page === 'signup') {
    return renderPage()
  }

  return (
    <MainLayout currentPage={page} setPage={setPage}>
      {renderPage()}
    </MainLayout>
  )
}
