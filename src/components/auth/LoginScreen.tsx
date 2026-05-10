import { useState, useEffect } from 'react'
import { loginWithPin, getAllCarers } from '../../lib/auth'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Delete } from 'lucide-react'

type CarerOption = { id: string; name: string; color: string; role: string }

export function LoginScreen() {
  const { login } = useAuth()
  const [carers, setCarers] = useState<CarerOption[]>([])
  const [selectedCarer, setSelectedCarer] = useState<CarerOption | null>(null)
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingCarers, setLoadingCarers] = useState(true)

  useEffect(() => {
    getAllCarers()
      .then(setCarers)
      .catch(() => toast.error('Could not load carers'))
      .finally(() => setLoadingCarers(false))
  }, [])

  const handlePinPress = (digit: string) => {
    if (pin.length < 4) setPin(p => p + digit)
  }

  const handleDelete = () => setPin(p => p.slice(0, -1))

  const handleSubmit = async () => {
    if (!selectedCarer || pin.length !== 4) return
    setIsLoading(true)
    try {
      const carer = await loginWithPin(selectedCarer.name, pin)
      login(carer)
      toast.success(`Welcome, ${carer.name}!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
      setPin('')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && selectedCarer) {
      handleSubmit()
    }
  }, [pin]) // eslint-disable-line

  const PIN_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="min-h-screen bg-gradient-to-br from-nova-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🌟</div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nova Care</h1>
        <p className="text-gray-500 mt-1 text-sm">Daily care tracking</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-purple-100 p-6">
        {/* Step 1: Pick carer */}
        {!selectedCarer ? (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Who's logging in?</h2>
            {loadingCarers ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-nova-300 border-t-nova-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {carers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCarer(c)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-nova-300 hover:bg-nova-50 transition-all active:scale-95"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Back + selected carer */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => { setSelectedCarer(null); setPin('') }}
                className="text-sm text-nova-600 font-medium"
              >
                ← Back
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: selectedCarer.color }}
                >
                  {selectedCarer.name[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-gray-700">{selectedCarer.name}</span>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-800 mb-5 text-center">Enter your PIN</h2>

            {/* PIN dots */}
            <div className="flex justify-center gap-4 mb-6">
              {[0,1,2,3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    i < pin.length
                      ? 'bg-nova-500 scale-110'
                      : 'bg-gray-200'
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
                    className="h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-lg active:scale-95 disabled:opacity-30 transition-all"
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
              <div className="flex justify-center mt-4">
                <div className="w-6 h-6 border-3 border-nova-300 border-t-nova-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-8">
        All data is securely stored and encrypted
      </p>
    </div>
  )
}
