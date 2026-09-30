import { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { useI18n, type StringKey } from '../lib/i18n';
import { CATEGORY_COLOR, CATEGORY_ORDER, EXPERTS, getExpert, type Category, type ExpertId } from '../experts/registry';
import type { Conversation } from '../lib/api';

const CATEGORY_LABEL: Record<Category, StringKey> = {
  engineering: 'categoryEngineering',
  finance: 'categoryFinance',
  management: 'categoryManagement',
  innovation: 'categoryInnovation',
};

type Filter = Category | 'all';
const FILTER_KEY = 'expert-hub:category';

function readStoredFilter(): Filter {
  try {
    const stored = localStorage.getItem(FILTER_KEY);
    if (stored === 'all' || CATEGORY_ORDER.includes(stored as Category)) return stored as Filter;
  } catch {
    // storage unavailable — fall through to default
  }
  return 'all';
}

interface ExpertCatalogProps {
  conversations: Conversation[];
  loading: boolean;
  onPick: (expertId: ExpertId) => void;
  onOpen: (conversation: Conversation) => void;
}

export function ExpertCatalog({ conversations, loading, onPick, onOpen }: ExpertCatalogProps) {
  const { t, lang, dir } = useI18n();
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const [filter, setFilterState] = useState<Filter>(readStoredFilter);
  const setFilter = (next: Filter) => {
    setFilterState(next);
    try {
      localStorage.setItem(FILTER_KEY, next);
    } catch {
      // ignore
    }
  };
  const sortedExperts = [...EXPERTS]
    .filter((e) => filter === 'all' || e.category === filter)
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
  const filters: Filter[] = ['all', ...CATEGORY_ORDER];
  const dateFormat = new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short' });

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        <p className="tech-label fade-up flex items-center gap-2" style={{ color: 'var(--line)' }}>
          <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--line)' }} />
          {lang === 'he' ? 'בחירת מומחה' : 'Select expert'}
        </p>
        <h1 className="fade-up mt-2 text-3xl font-extrabold md:text-4xl" style={{ ['--delay' as string]: '0.05s' }}>
          {t('pickExpert')}
        </h1>
        <p className="fade-up mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)', ['--delay' as string]: '0.1s' }}>
          {t('pickExpertHint')}
        </p>
        <div className="dim-ticks mt-6">
          <div className="dim-line">
            <span>
              {sortedExperts.length.toString().padStart(2, '0')} {lang === 'he' ? 'מומחים' : 'EXPERTS'}
            </span>
          </div>
        </div>

        <div role="tablist" aria-label={lang === 'he' ? 'קטגוריות' : 'Categories'} className="mt-6 flex flex-wrap gap-2">
          {filters.map((f) => {
            const selected = filter === f;
            const count = f === 'all' ? EXPERTS.length : EXPERTS.filter((e) => e.category === f).length;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(f)}
                className="flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors"
                style={{
                  borderColor: selected ? (f === 'all' ? 'var(--accent)' : CATEGORY_COLOR[f]) : 'var(--border)',
                  background: selected ? 'rgba(108,182,255,0.1)' : 'transparent',
                  color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {f !== 'all' && <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLOR[f] }} />}
                {t(f === 'all' ? 'categoryAll' : CATEGORY_LABEL[f])}
                <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div key={filter} role="tabpanel" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedExperts.map((expert, index) => (
            <button
              key={expert.id}
              type="button"
              onClick={() => onPick(expert.id)}
              className="bp-panel bp-corners bp-card fade-up group flex flex-col gap-3 p-5 text-start"
              style={{ ['--delay' as string]: `${0.15 + index * 0.06}s` }}
            >
              <span className="flex items-center justify-between gap-2">
                <span
                  className="grid h-12 w-12 place-items-center rounded-lg border transition-colors group-hover:border-[var(--border-strong)]"
                  style={{ borderColor: 'var(--border)', background: 'rgba(6,16,29,0.6)', color: CATEGORY_COLOR[expert.category] }}
                >
                  <expert.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="tech-label" dir="ltr">
                  EXP-{String(index + 1).padStart(2, '0')}
                </span>
              </span>
              <span className="text-lg font-bold">{expert.name[lang]}</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {expert.summary[lang]}
              </span>
              <span
                className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs"
                style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_COLOR[expert.category] }} />
                  {t(CATEGORY_LABEL[expert.category])}
                </span>
                <span
                  className="flex items-center gap-1 font-bold transition-colors group-hover:text-[var(--accent)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {lang === 'he' ? 'פתיחה' : 'Open'}
                  <Chevron className="h-4 w-4 transition-transform group-hover:translate-x-[-2px] ltr:group-hover:translate-x-[2px]" aria-hidden="true" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <aside className="bp-panel bp-corners fade-up h-fit p-4 lg:sticky lg:top-20" style={{ ['--delay' as string]: '0.3s' }}>
        <p className="tech-label">LOG</p>
        <h2 className="mb-3 mt-1 font-bold">{t('recent')}</h2>
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
                    className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-start transition-colors hover:bg-[rgba(108,182,255,0.08)]"
                  >
                    <MessageSquare
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: expert ? CATEGORY_COLOR[expert.category] : 'var(--text-muted)' }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span dir="auto" className="block truncate text-start text-sm font-medium">{conversation.title || t('untitled')}</span>
                      <span className="mono block text-xs" style={{ color: 'var(--text-muted)' }}>
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
