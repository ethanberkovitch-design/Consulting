import { useCallback, useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { AuthScreen } from './components/AuthScreen';
import { ExpertCatalog } from './components/ExpertCatalog';
import { Workspace } from './components/Workspace';
import { LibraryAdmin } from './components/LibraryAdmin';
import { useAuth } from './hooks/useAuth';
import { useI18n } from './lib/i18n';
import { listConversations, type Conversation } from './lib/api';
import { isAdmin } from './lib/library';
import { getExpert, type ExpertId } from './experts/registry';

/** key stays fixed when a new conversation gets its id, so the workspace is not remounted mid-answer. */
interface OpenWorkspace {
  key: string;
  expertId: ExpertId;
  conversation: Conversation | null;
}

export default function App() {
  const { user, loading, signOut } = useAuth();
  const { t } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [active, setActive] = useState<OpenWorkspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminFor, setAdminFor] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const refresh = useCallback(async () => {
    setListLoading(true);
    try {
      const list = await listConversations();
      setConversations(list);
      // The server titles a conversation from its first question; pick that up.
      setActive((prev) => {
        const match = prev?.conversation && list.find((c) => c.id === prev.conversation?.id);
        return prev && match ? { ...prev, conversation: match } : prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('somethingWrong'));
    } finally {
      setListLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  // Only decides whether to show the library button; the server enforces access.
  useEffect(() => {
    if (user) void isAdmin().then((yes) => setAdminFor(yes ? user.id : null));
  }, [user]);
  const admin = !!user && adminFor === user.id;

  const handleSignOut = async () => {
    await signOut();
    setConversations([]);
    setActive(null);
    setShowLibrary(false);
  };

  // Picking an expert only opens the workspace; the conversation row is created
  // on the first question or upload, so browsing never leaves empty conversations.
  const startConversation = (expertId: ExpertId) => {
    setError(null);
    setShowLibrary(false);
    setActive({ key: `new-${Date.now()}`, expertId, conversation: null });
  };
  const openConversation = (conversation: Conversation) =>
    setActive({ key: conversation.id, expertId: conversation.expert_id, conversation });
  const handleCreated = useCallback(
    (conversation: Conversation) => setActive((prev) => (prev ? { ...prev, conversation } : prev)),
    [],
  );

  const activeExpert = active ? getExpert(active.expertId) : undefined;

  return (
    <>
      <TopBar
        email={user?.email}
        onHome={() => {
          setActive(null);
          setShowLibrary(false);
        }}
        onSignOut={handleSignOut}
        onLibrary={
          admin
            ? () => {
                setActive(null);
                setShowLibrary(true);
              }
            : undefined
        }
      />
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
      ) : showLibrary && admin ? (
        <LibraryAdmin />
      ) : active && activeExpert ? (
        <Workspace
          key={active.key}
          user={user}
          expert={activeExpert}
          conversation={active.conversation}
          onCreated={handleCreated}
          onBack={() => setActive(null)}
          onChanged={refresh}
        />
      ) : (
        <ExpertCatalog
          conversations={conversations}
          loading={listLoading}
          onPick={startConversation}
          onOpen={openConversation}
        />
      )}
    </>
  );
}
