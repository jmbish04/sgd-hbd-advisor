import { Button } from '@/components/ui/button'
import { Page } from '@/App'

interface MainLayoutProps {
  children: React.ReactNode
  currentPage: Page
  setPage: (page: Page) => void
}

export function MainLayout({ children, currentPage, setPage }: MainLayoutProps) {
  const navItems = [
    { name: 'Home', page: 'home' as Page },
    { name: 'Dashboard', page: 'dashboard' as Page },
    { name: 'Chat', page: 'chat' as Page },
    { name: 'Health', page: 'health' as Page },
  ]

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col w-64 border-r bg-muted/40 p-4">
        <div className="mb-8">
          <h2 className="text-xl font-bold">Gold Standard</h2>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant={currentPage === item.page ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setPage(item.page)}
            >
              {item.name}
            </Button>
          ))}
        </nav>
        <div className="mt-auto pt-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setPage('login')}
          >
            Login / Signup
          </Button>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
