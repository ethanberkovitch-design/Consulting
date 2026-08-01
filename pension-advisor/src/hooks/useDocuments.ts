import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ExtractedStatementData } from '../lib/pdfParser';

export interface UploadedDocument {
  id: string;
  file_name: string;
  storage_path: string;
  extracted_balance: number | null;
  extracted_deposit_fee: number | null;
  extracted_balance_fee: number | null;
  extracted_fund_name: string | null;
  created_at: string;
}

const BUCKET = 'pension-documents';

export function useDocuments(userId: string | null) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setDocuments((data as UploadedDocument[] | null) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (file: File, extracted: ExtractedStatementData) => {
      if (!userId) return;
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('uploaded_documents').insert({
        user_id: userId,
        file_name: file.name,
        storage_path: path,
        extracted_balance: extracted.balance,
        extracted_deposit_fee: extracted.depositFee,
        extracted_balance_fee: extracted.balanceFee,
        extracted_fund_name: extracted.fundName,
      });
      if (insertError) throw insertError;
      await refresh();
    },
    [userId, refresh],
  );

  const remove = useCallback(
    async (doc: UploadedDocument) => {
      await supabase.storage.from(BUCKET).remove([doc.storage_path]);
      await supabase.from('uploaded_documents').delete().eq('id', doc.id);
      await refresh();
    },
    [refresh],
  );

  return { documents, loading, upload, remove, refresh };
}
