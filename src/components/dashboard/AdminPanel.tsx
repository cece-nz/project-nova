import { useState, useEffect } from 'react';
import { getMedications, createMedication } from '../../lib/db';
import { getAllCarers, createCarer, updateCarerPin, deleteCarer } from '../../lib/auth';
import { getMedicalStaff, createMedicalStaff, deactivateMedicalStaff } from '../../lib/appointments';
import { CARER_COLORS } from '../../utils';
import { ROLE_LABEL } from '../../lib/permissions';
import { useAuth } from '../../hooks/useAuth';
import { Field, Input } from '../ui/FormElements';
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { Medication, CarerRole, MedicalStaff, MedicalStaffType } from '../../types';
import toast from 'react-hot-toast';

type AdminSection = 'carers' | 'medications' | 'medical_staff'

export function AdminPanel() {
  const [section, setSection] = useState<AdminSection | null>(null);
  const toggle = (s: AdminSection) => setSection(prev => prev === s ? null : s)

  return (
    <div className='space-y-4 pb-32'>
      <h2 className='text-xl font-bold text-gray-900'>Admin</h2>

      <AdminSection
        title='👤 Manage Users'
        isOpen={section === 'carers'}
        onToggle={() => toggle('carers')}
      >
        <CarerAdmin />
      </AdminSection>

      <AdminSection
        title='🏥 Manage Medical Staff'
        isOpen={section === 'medical_staff'}
        onToggle={() => toggle('medical_staff')}
      >
        <MedicalStaffAdmin />
      </AdminSection>

      <AdminSection
        title='💊 Manage Medications'
        isOpen={section === 'medications'}
        onToggle={() => toggle('medications')}
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

function CarerPinCard({ carer, onDeleted }: { carer: CarerAdminRow; onDeleted: () => void }) {
  const { carer: self } = useAuth();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isSelf = self?.id === carer.id;

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

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteCarer(carer.id);
      toast.success(`${carer.name} removed`);
      onDeleted();
    } catch {
      toast.error('Failed to remove user');
    } finally {
      setIsLoading(false);
      setConfirming(false);
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
              {isSelf && <span className='ml-1.5 text-xs font-normal text-gray-400'>(you)</span>}
            </p>
            <p className='text-xs text-gray-400'>
              {ROLE_LABEL[carer.role as CarerRole] ?? carer.role}
            </p>
          </div>
        </div>
        {!editing && !confirming && (
          <div className='flex items-center gap-2 shrink-0'>
            <button
              type='button'
              onClick={() => setEditing(true)}
              className='text-sm font-semibold text-nova-600 hover:text-nova-700'
            >
              Change PIN
            </button>
            {!isSelf && (
              <button
                type='button'
                onClick={() => setConfirming(true)}
                className='p-1.5 text-gray-300 hover:text-red-400 transition-colors'
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {confirming && (
        <div className='mt-3 pt-3 border-t border-gray-200/80'>
          <p className='text-sm text-gray-700 mb-3'>
            Remove <strong>{carer.name}</strong>? They won't be able to log in.
          </p>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => setConfirming(false)}
              className='flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleDelete}
              disabled={isLoading}
              className='flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60'
            >
              {isLoading ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      )}

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
              onClick={() => { setEditing(false); setNewPin(''); }}
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
  const [role, setRole] = useState<CarerRole>('helper');
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
      await createCarer(name.trim(), pin, role, color);
      toast.success(`${name} added!`);
      setName('');
      setPin('');
      setRole('helper');
      setShowAdd(false);
      getAllCarers().then(setCarers);
    } catch {
      toast.error('Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className='space-y-2 mb-4'>
        {carers.map((c) => (
          <CarerPinCard key={c.id} carer={c} onDeleted={() => getAllCarers().then(setCarers)} />
        ))}
      </div>

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className='flex items-center gap-2 text-sm font-semibold text-nova-600 hover:text-nova-700'
        >
          <Plus size={16} /> Add user
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          className='border border-gray-200 rounded-2xl p-4 space-y-3'
        >
          <p className='font-semibold text-gray-700 text-sm'>New user</p>
          <Field label='Name'>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Full name'
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
          <Field
            label='Role'
            hint='Admin: full access · Medical: read-only · Helper: log entries only'
          >
            <div className='flex gap-2'>
              {(['admin', 'medical', 'helper'] as CarerRole[]).map((r) => (
                <button
                  key={r}
                  type='button'
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    role === r
                      ? 'bg-nova-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
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

// ============================================================
// Medical staff admin
// ============================================================

const STAFF_TYPES: { value: MedicalStaffType; label: string }[] = [
  { value: 'gp', label: 'GP' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'physio', label: 'Physio' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'other', label: 'Other' },
]

function MedicalStaffAdmin() {
  const [staff, setStaff] = useState<MedicalStaff[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<MedicalStaffType>('gp')
  const [specialty, setSpecialty] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { getMedicalStaff().then(setStaff) }, [])

  const reset = () => {
    setName(''); setType('gp'); setSpecialty('')
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await createMedicalStaff({
        name: name.trim(), type,
        specialty: specialty.trim() || null,
        phone: null,
        email: null,
        notes: null,
      })
      toast.success(`${name} added!`)
      reset(); setShowAdd(false)
      getMedicalStaff().then(setStaff)
    } catch { toast.error('Failed to add medical staff') }
    finally { setIsLoading(false) }
  }

  const handleRemove = async (s: MedicalStaff) => {
    try {
      await deactivateMedicalStaff(s.id)
      toast.success(`${s.name} removed`)
      getMedicalStaff().then(setStaff)
    } catch { toast.error('Failed to remove') }
  }

  return (
    <div>
      <div className='space-y-2 mb-4'>
        {staff.map(s => (
          <div key={s.id} className='p-3 bg-gray-50 rounded-xl flex items-center justify-between gap-2'>
            <div className='min-w-0'>
              <p className='text-sm font-semibold text-gray-800 truncate'>{s.name}</p>
              <p className='text-xs text-gray-500'>
                {STAFF_TYPES.find(t => t.value === s.type)?.label ?? s.type}
                {s.specialty ? ` · ${s.specialty}` : ''}
              </p>
            </div>
            <button
              type='button' onClick={() => handleRemove(s)}
              className='shrink-0 p-1.5 text-gray-300 hover:text-red-400 transition-colors'
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {staff.length === 0 && (
          <p className='text-sm text-gray-400 italic'>No medical staff added yet.</p>
        )}
      </div>

      {!showAdd ? (
        <button onClick={() => setShowAdd(true)}
          className='flex items-center gap-2 text-sm font-semibold text-nova-600 hover:text-nova-700'
        >
          <Plus size={16} /> Add medical staff
        </button>
      ) : (
        <form onSubmit={handleAdd} className='border border-gray-200 rounded-2xl p-4 space-y-3'>
          <p className='font-semibold text-gray-700 text-sm'>New medical staff</p>
          <Field label='Name'>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder='Dr. Smith' required />
          </Field>
          <Field label='Type'>
            <div className='flex flex-wrap gap-2'>
              {STAFF_TYPES.map(t => (
                <button key={t.value} type='button' onClick={() => setType(t.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    type === t.value ? 'bg-nova-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >{t.label}</button>
              ))}
            </div>
          </Field>
          <Field label='Specialty (optional)'>
            <Input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder='e.g. Paediatric Urology' />
          </Field>
          <div className='flex gap-2'>
            <button type='button' onClick={() => { setShowAdd(false); reset() }}
              className='flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600'
            >Cancel</button>
            <button type='submit' disabled={isLoading}
              className='flex-1 py-3 rounded-xl bg-nova-500 text-white text-sm font-semibold disabled:opacity-60'
            >{isLoading ? 'Adding...' : 'Add'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
