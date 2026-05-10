import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { LoginScreen } from './components/auth/LoginScreen'
import { Dashboard } from './components/dashboard/Dashboard'

function AppContent() {
  const { carer, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nova-50">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">🌟</div>
          <div className="w-8 h-8 border-4 border-nova-300 border-t-nova-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return carer ? <Dashboard /> : <LoginScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            borderRadius: '16px',
            background: '#1f2937',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </AuthProvider>
  )
}
