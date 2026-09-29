import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { useI18n, type StringKey } from '../lib/i18n';
import { CATEGORY_COLOR, CATEGORY_ORDER, EXPERTS, getExpert, type Category, type ExpertId } from '../experts/registry';
import type { Conversation } from '../lib/api';

const CATEGORY_LABEL: Record<Category, StringKey> = {
  engineering: 'categoryEngineering',
  finance: 'categoryFinance',
  management: 'categoryManagement',
};

interface ExpertCatalogProps {
  conversations: Conversation[];
  loading: boolean;
  onPick: (expertId: ExpertId) => void;
  onOpen: (conversation: Conversation) => void;
}

export function ExpertCatalog({ conversations, loading, onPick, onOpen }: ExpertCatalogProps) {
  const { t, lang, dir } = useI18n();
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const sortedExperts = [...EXPERTS].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );
  const dateFormat = new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short' });

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t('pickExpert')}</h1>
        <p className="mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          {t('pickExpertHint')}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedExperts.map((expert) => (
            <button
              key={expert.id}
              type="button"
              onClick={() => onPick(expert.id)}
              className="group flex flex-col gap-3 rounded-xl border p-5 text-start transition-colors hover:border-[var(--brand)]"
              style={{ background: 'var(--surface-1)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <span className="flex items-center justify-between gap-2">
                <span
                  className="grid h-11 w-11 place-items-center rounded-lg"
                  style={{ background: 'var(--surface-2)', color: CATEGORY_COLOR[expert.category] }}
                >
                  <expert.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLOR[expert.category] }} />
                  {t(CATEGORY_LABEL[expert.category])}
                  <Chevron className="ms-1 h-5 w-5 opacity-40 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                </span>
              </span>
              <span className="text-lg font-bold">
                {expert.name[lang]}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {expert.summary[lang]}
              </span>
              <span className="mt-auto border-t pt-3 text-xs" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                {expert.typicalDocuments[lang]}
              </span>
            </button>
          ))}
        </div>
      </section>

      <aside
        className="h-fit rounded-xl border p-4 lg:sticky lg:top-20"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
      >
        <h2 className="mb-3 font-bold">{t('recent')}</h2>
        {loading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('loading')}
          </p>
        ) : conversations.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('noRecent')}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {conversations.map((conversation) => {
              const expert = getExpert(conversation.expert_id);
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(conversation)}
                    className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-start hover:bg-[var(--surface-2)]"
                  >
                    <MessageSquare
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: expert ? CATEGORY_COLOR[expert.category] : 'var(--text-muted)' }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span dir="auto" className="block truncate text-start text-sm font-medium">{conversation.title || t('untitled')}</span>
                      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                        {expert?.name[lang]} · {dateFormat.format(new Date(conversation.updated_at))}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </main>
  );
}
