import { useState, useEffect } from 'react'
import { loginWithPinOnly } from '../../lib/auth'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Delete } from 'lucide-react'

export function LoginScreen() {
  const { login } = useAuth()
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handlePinPress = (digit: string) => {
    if (pin.length < 4) setPin(p => p + digit)
  }

  const handleDelete = () => setPin(p => p.slice(0, -1))

  const handleSubmit = async () => {
    if (pin.length !== 4 || isLoading) return
    setIsLoading(true)
    try {
      const carer = await loginWithPinOnly(pin)
      login(carer)
      toast.success(`Welcome, ${carer.name}!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
      setPin('')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (pin.length === 4) handleSubmit()
  }, [pin]) // eslint-disable-line

  const PIN_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="min-h-screen bg-gradient-to-br from-nova-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🌟</div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nova Care</h1>
        <p className="text-gray-500 mt-1 text-sm">Daily care tracking</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-purple-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5 text-center">Enter your PIN</h2>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 mb-6">
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length ? 'bg-nova-500 scale-110' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {PIN_KEYS.map((key, i) => {
            if (key === '') return <div key={i} />
            if (key === '⌫') return (
              <button
                key={i}
                onClick={handleDelete}
                disabled={pin.length === 0}
                className="h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 disabled:opacity-30 transition-all"
              >
                <Delete size={20} />
              </button>
            )
            return (
              <button
                key={i}
                onClick={() => handlePinPress(key)}
                disabled={isLoading}
                className="h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-800 font-semibold text-xl active:scale-95 active:bg-nova-100 transition-all"
              >
                {key}
              </button>
            )
          })}
        </div>

        {isLoading && (
          <div className="flex justify-center mt-5">
            <div className="w-6 h-6 border-[3px] border-nova-300 border-t-nova-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-8">All data is securely stored and encrypted</p>
    </div>
  )
}
