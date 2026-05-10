import { useState, useEffect } from 'react';
import { getMedications, createMedication } from '../../lib/db';
import { getAllCarers, createCarer, updateCarerPin } from '../../lib/auth';
import { CARER_COLORS } from '../../utils';
import { Field, Input } from '../ui/FormElements';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import type { Medication } from '../../types';
import toast from 'react-hot-toast';

export function AdminPanel() {
  const [section, setSection] = useState<'carers' | 'medications' | null>(null);

  return (
    <div className='space-y-4 pb-32'>
      <h2 className='text-xl font-bold text-gray-900'>Admin</h2>

      <AdminSection
        title='👤 Manage Carers'
        isOpen={section === 'carers'}
        onToggle={() => setSection(section === 'carers' ? null : 'carers')}
      >
        <CarerAdmin />
      </AdminSection>

      <AdminSection
        title='💊 Manage Medications'
        isOpen={section === 'medications'}
        onToggle={() =>
          setSection(section === 'medications' ? null : 'medications')
        }
      >
        <MedicationAdmin />
      </AdminSection>
    </div>
  );
}

function AdminSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className='bg-white rounded-2xl border border-gray-100 overflow-hidden'>
      <button
        onClick={onToggle}
        className='w-full flex items-center justify-between p-4 text-left'
      >
        <span className='font-semibold text-gray-800'>{title}</span>
        {isOpen ? (
          <ChevronUp size={18} className='text-gray-400' />
        ) : (
          <ChevronDown size={18} className='text-gray-400' />
        )}
      </button>
      {isOpen && (
        <div className='px-4 pb-4 border-t border-gray-100 pt-4'>
          {children}
        </div>
      )}
    </div>
  );
}

type CarerAdminRow = { id: string; name: string; color: string; role: string };

function CarerPinCard({ carer }: { carer: CarerAdminRow }) {
  const [editing, setEditing] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }
    setIsLoading(true);
    try {
      await updateCarerPin(carer.id, newPin);
      toast.success(`PIN updated for ${carer.name}`);
      setNewPin('');
      setEditing(false);
    } catch {
      toast.error('Failed to update PIN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='p-3 bg-gray-50 rounded-xl'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-3 min-w-0'>
          <div
            className='w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm'
            style={{ backgroundColor: carer.color }}
          >
            {carer.name[0]}
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-gray-800 truncate'>
              {carer.name}
            </p>
            <p className='text-xs text-gray-400'>{carer.role}</p>
          </div>
        </div>
        {!editing && (
          <button
            type='button'
            onClick={() => setEditing(true)}
            className='shrink-0 text-sm font-semibold text-nova-600 hover:text-nova-700'
          >
            Change PIN
          </button>
        )}
      </div>
      {editing && (
        <form
          onSubmit={handleSubmit}
          className='mt-3 pt-3 border-t border-gray-200/80 space-y-3'
        >
          <Field label='New 4-digit PIN'>
            <Input
              value={newPin}
              onChange={(e) =>
                setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              placeholder='1234'
              inputMode='numeric'
              autoComplete='new-password'
              required
            />
          </Field>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => {
                setEditing(false);
                setNewPin('');
              }}
              className='flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 py-2.5 rounded-xl bg-nova-500 text-white text-sm font-semibold disabled:opacity-60'
            >
              {isLoading ? 'Saving...' : 'Save PIN'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function CarerAdmin() {
  const [carers, setCarers] = useState<CarerAdminRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [color, setColor] = useState(CARER_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getAllCarers().then(setCarers);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }
    setIsLoading(true);
    try {
      await createCarer(name.trim(), pin, 'carer', color);
      toast.success(`${name} added!`);
      setName('');
      setPin('');
      setShowAdd(false);
      getAllCarers().then(setCarers);
    } catch {
      toast.error('Failed to add carer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className='space-y-2 mb-4'>
        {carers.map((c) => (
          <CarerPinCard key={c.id} carer={c} />
        ))}
      </div>

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className='flex items-center gap-2 text-sm font-semibold text-nova-600 hover:text-nova-700'
        >
          <Plus size={16} /> Add carer
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          className='border border-gray-200 rounded-2xl p-4 space-y-3'
        >
          <p className='font-semibold text-gray-700 text-sm'>New carer</p>
          <Field label='Name'>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Carer name'
              required
            />
          </Field>
          <Field label='4-digit PIN'>
            <Input
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              placeholder='1234'
              inputMode='numeric'
              required
            />
          </Field>
          <Field label='Colour'>
            <div className='flex gap-2 flex-wrap'>
              {CARER_COLORS.map((c) => (
                <button
                  key={c}
                  type='button'
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => setShowAdd(false)}
              className='flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 py-3 rounded-xl bg-nova-500 text-white text-sm font-semibold disabled:opacity-60'
            >
              {isLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function MedicationAdmin() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getMedications().then(setMedications);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const scheduledTimes = times
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await createMedication({
        name: name.trim(),
        dose: dose.trim(),
        scheduled_times: scheduledTimes,
        notes: notes.trim() || null,
        color: '#8b5cf6',
      });
      toast.success(`${name} added!`);
      setName('');
      setDose('');
      setTimes('');
      setNotes('');
      setShowAdd(false);
      getMedications().then(setMedications);
    } catch {
      toast.error('Failed to add medication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className='space-y-2 mb-4'>
        {medications.map((m) => (
          <div key={m.id} className='p-3 bg-gray-50 rounded-xl'>
            <p className='text-sm font-semibold text-gray-800'>{m.name}</p>
            <p className='text-xs text-gray-500'>
              {m.dose} · {m.scheduled_times.join(', ') || 'as needed'}
            </p>
          </div>
        ))}
      </div>

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className='flex items-center gap-2 text-sm font-semibold text-nova-600 hover:text-nova-700'
        >
          <Plus size={16} /> Add medication
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          className='border border-gray-200 rounded-2xl p-4 space-y-3'
        >
          <p className='font-semibold text-gray-700 text-sm'>New medication</p>
          <Field label='Name'>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Oxybutynin'
              required
            />
          </Field>
          <Field label='Standard dose'>
            <Input
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder='e.g. 5ml'
              required
            />
          </Field>
          <Field
            label='Scheduled times'
            hint='Comma separated, e.g. 08:00, 13:00, 18:00'
          >
            <Input
              value={times}
              onChange={(e) => setTimes(e.target.value)}
              placeholder='08:00, 13:00, 18:00'
            />
          </Field>
          <Field label='Notes (optional)'>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Any special instructions'
            />
          </Field>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => setShowAdd(false)}
              className='flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 py-3 rounded-xl bg-nova-500 text-white text-sm font-semibold disabled:opacity-60'
            >
              {isLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
