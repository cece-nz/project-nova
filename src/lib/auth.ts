import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import type { Carer, CarerRole } from '../types';

const STORAGE_KEY = 'nova_care_carer';

export async function loginWithPin(name: string, pin: string): Promise<Carer> {
  const { data: carers, error } = await supabase
    .from('carers')
    .select('*')
    .eq('name', name)
    .eq('is_active', true)
    .limit(1);

  if (error) throw new Error('Failed to connect to database');
  if (!carers || carers.length === 0) throw new Error('User not found');

  const carer = carers[0] as Carer;

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
  role: CarerRole = 'helper',
  color: string = '#6366f1',
): Promise<Carer> {
  const pin_hash = await hashPin(pin);

  const { data, error } = await supabase
    .from('carers')
    .insert({ name, pin_hash, role, color })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      'User insert did not return a row. Confirm RLS policies allow SELECT on `carers` for the anon key after INSERT.',
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
