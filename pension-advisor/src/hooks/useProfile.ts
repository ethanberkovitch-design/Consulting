import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { PlannerInputs } from '../types';

interface ProfileRow {
  current_age: number;
  retirement_age: number;
  current_balance: number;
  monthly_salary: number;
  contribution_rate: number;
  selected_track_ids: string[];
  actual_deposit_fee: number | null;
  actual_balance_fee: number | null;
}

function rowToInputs(row: ProfileRow): PlannerInputs {
  return {
    currentAge: row.current_age,
    retirementAge: row.retirement_age,
    currentBalance: row.current_balance,
    monthlySalary: row.monthly_salary,
    contributionRate: row.contribution_rate,
    selectedTrackIds: row.selected_track_ids,
    actualDepositFee: row.actual_deposit_fee,
    actualBalanceFee: row.actual_balance_fee,
  };
}

function inputsToRow(userId: string, inputs: PlannerInputs) {
  return {
    user_id: userId,
    current_age: inputs.currentAge,
    retirement_age: inputs.retirementAge,
    current_balance: inputs.currentBalance,
    monthly_salary: inputs.monthlySalary,
    contribution_rate: inputs.contributionRate,
    selected_track_ids: inputs.selectedTrackIds,
    actual_deposit_fee: inputs.actualDepositFee,
    actual_balance_fee: inputs.actualBalanceFee,
    updated_at: new Date().toISOString(),
  };
}

export function useProfile(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<PlannerInputs | null> => {
    if (!userId) return null;
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('pension_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setLoading(false);
    if (fetchError) {
      setError(fetchError.message);
      return null;
    }
    return data ? rowToInputs(data as ProfileRow) : null;
  }, [userId]);

  const save = useCallback(
    async (inputs: PlannerInputs) => {
      if (!userId) return;
      setSaving(true);
      setError(null);
      const { error: saveError } = await supabase
        .from('pension_profiles')
        .upsert(inputsToRow(userId, inputs));
      setSaving(false);
      if (saveError) {
        setError(saveError.message);
      } else {
        setSavedAt(new Date());
      }
    },
    [userId],
  );

  const clear = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    const { error: deleteError } = await supabase.from('pension_profiles').delete().eq('user_id', userId);
    setSaving(false);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setSavedAt(null);
    }
  }, [userId]);

  useEffect(() => {
    setSavedAt(null);
  }, [userId]);

  return { load, save, clear, loading, saving, savedAt, error };
}
