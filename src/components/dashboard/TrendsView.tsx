import { useState, useEffect } from 'react'
import { getDailyTrends, type DailyPoint } from '../../lib/db'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'

type Range = '7d' | '14d' | '30d'

const RANGES: { id: Range; label: string; days: number }[] = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '14d', label: '14 days', days: 14 },
  { id: '30d', label: '30 days', days: 30 },
]

function shortLabel(label: string) {
  // 'Mon 5 May' → 'Mon 5'
  return label.split(' ').slice(0, 2).join(' ')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs space-y-1 min-w-[140px]">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry: { color: string; name: string; value: number }) => (
        <div key={entry.name} className="flex items-center justify-between gap-3">
          <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
          <span className="text-gray-600 font-mono">{entry.value}{entry.name === 'Meds' ? '' : 'ml'}</span>
        </div>
      ))}
    </div>
  )
}

export function TrendsView() {
  const [range, setRange] = useState<Range>('14d')
  const [data, setData] = useState<DailyPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const days = RANGES.find(r => r.id === range)!.days
    getDailyTrends(days)
      .then(setData)
      .finally(() => setIsLoading(false))
  }, [range])

  const chartData = data.map(d => ({ ...d, label: shortLabel(d.label) }))

  return (
    <div className="space-y-5">
      {/* Range chips */}
      <div className="flex gap-2">
        {RANGES.map(r => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              range === r.id ? 'bg-nova-100 text-nova-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-48 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Goal callout */}
          <div className="bg-nova-50 border border-nova-100 rounded-xl px-3 py-2 text-xs text-nova-700">
            <span className="font-semibold">Goal:</span> Potty ↑ · Cathy ↓ · Nappy ↓
          </div>

          {/* Fluid balance chart */}
          <ChartCard title="Fluid balance (ml)">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line type="monotone" dataKey="fluidMl" name="Fluid in" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="cathyMl" name="Cathy" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Output breakdown chart */}
          <ChartCard title="Output breakdown (ml)">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line type="monotone" dataKey="cathyMl" name="Cathy" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="pottyMl" name="Potty" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="nappyMl" name="Nappy" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <ReferenceLine y={0} stroke="#e5e7eb" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Meds chart */}
          <ChartCard title="Medications given per day">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="meds" name="Meds" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  )
}
