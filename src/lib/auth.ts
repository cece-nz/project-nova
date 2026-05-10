import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import type { Carer } from '../types';

const STORAGE_KEY = 'nova_care_carer';

export async function loginWithPin(name: string, pin: string): Promise<Carer> {
  // Fetch carer by name

  const { data: carers, error } = await supabase
    .from('carers')
    .select('*')
    .eq('name', name)
    .eq('is_active', true)
    .limit(1);

  if (error) throw new Error('Failed to connect to database');
  if (!carers || carers.length === 0) throw new Error('Carer not found');

  const carer = carers[0] as Carer;

  // Verify PIN
  const valid = await bcrypt.compare(pin, carer.pin_hash);
  if (!valid) throw new Error('Incorrect PIN');

  return carer;
}

export function getStoredCarer(): Carer | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as Carer;
  } catch {
    return null;
  }
}

export function logout(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function getAllCarers(): Promise<
  Pick<Carer, 'id' | 'name' | 'color' | 'role'>[]
> {
  const { data, error } = await supabase
    .from('carers')
    .select('id, name, color, role')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createCarer(
  name: string,
  pin: string,
  role: 'admin' | 'carer' = 'carer',
  color: string = '#6366f1',
): Promise<Carer> {
  const pin_hash = await hashPin(pin);

  const { data, error } = await supabase
    .from('carers')
    .insert({ name, pin_hash, role, color })
    .select()
    .maybeSingle();

  // #region agent log
  fetch('http://127.0.0.1:7731/ingest/7ed87461-f639-4d91-84b6-9b6411a1ad64',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e48aa4'},body:JSON.stringify({sessionId:'e48aa4',runId:'pre-fix',hypothesisId:'C',location:'auth.ts:createCarer',message:'after carers insert single()',data:{pgCode:error?.code,pgMsg:error?.message,nameLen:name.length,hasData:!!data},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (error) throw error;
  if (!data) {
    throw new Error(
      'Carer insert did not return a row. Confirm RLS policies allow SELECT on `carers` for the anon key after INSERT.',
    );
  }
  return data as Carer;
}

export async function updateCarerPin(
  carerId: string,
  newPin: string,
): Promise<void> {
  const pin_hash = await hashPin(newPin);

  const { error } = await supabase
    .from('carers')
    .update({ pin_hash })
    .eq('id', carerId);

  if (error) throw error;
}
