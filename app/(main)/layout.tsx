import Sidebar from '@/components/sidebar'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { ToastProvider } from '@/components/toast'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <ToastProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Navbar userName={session.name} />
        <div className="layout">
          <Sidebar />
          <div className="main-content">
            {children}
            <Footer />
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
