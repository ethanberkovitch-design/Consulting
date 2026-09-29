import { useCallback, useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { AuthScreen } from './components/AuthScreen';
import { ExpertCatalog } from './components/ExpertCatalog';
import { Workspace } from './components/Workspace';
import { useAuth } from './hooks/useAuth';
import { useI18n } from './lib/i18n';
import { createConversation, listConversations, type Conversation } from './lib/api';
import { getExpert, type ExpertId } from './experts/registry';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const { t } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [active, setActive] = useState<Conversation | null>(null);
  const [busyExpert, setBusyExpert] = useState<ExpertId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setListLoading(true);
    try {
      const list = await listConversations();
      setConversations(list);
      // The server titles a conversation from its first question; pick that up.
      setActive((prev) => (prev ? (list.find((c) => c.id === prev.id) ?? prev) : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('somethingWrong'));
    } finally {
      setListLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  const handleSignOut = async () => {
    await signOut();
    setConversations([]);
    setActive(null);
  };

  const startConversation = async (expertId: ExpertId) => {
    setError(null);
    setBusyExpert(expertId);
    try {
      setActive(await createConversation(expertId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('somethingWrong'));
    } finally {
      setBusyExpert(null);
    }
  };

  const activeExpert = active ? getExpert(active.expert_id) : undefined;

  return (
    <>
      <TopBar email={user?.email} onHome={() => setActive(null)} onSignOut={handleSignOut} />
      {error && (
        <p role="alert" className="mx-auto mt-4 max-w-7xl px-4 text-sm" style={{ color: 'var(--status-critical)' }}>
          {error}
        </p>
      )}
      {loading ? (
        <p className="mx-auto max-w-7xl px-4 py-10" style={{ color: 'var(--text-muted)' }}>
          {t('loading')}
        </p>
      ) : !user ? (
        <AuthScreen />
      ) : active && activeExpert ? (
        <Workspace
          key={active.id}
          user={user}
          expert={activeExpert}
          conversation={active}
          onBack={() => setActive(null)}
          onChanged={refresh}
        />
      ) : (
        <ExpertCatalog
          conversations={conversations}
          loading={listLoading}
          busyExpert={busyExpert}
          onPick={startConversation}
          onOpen={setActive}
        />
      )}
    </>
  );
}
