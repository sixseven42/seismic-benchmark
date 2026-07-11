import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GithubSlugger from 'github-slugger';
import { visit } from 'unist-util-visit';
import { useLanguage } from '../contexts/LanguageContext';
import './TutorialPage.css';

interface TocItem {
  level: number;
  text: string;
  id: string;
}

const NAV_HEIGHT = 80;

function getNodeText(node: any): string {
  const texts: string[] = [];
  visit(node, 'text', (n: any) => {
    texts.push(n.value);
  });
  return texts.join('');
}

function remarkHeadingIds() {
  return (tree: any) => {
    const children = tree.children || [];
    const explicitIds = new Map<any, string>();
    const removeIndexes: number[] = [];

    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      let explicitId: string | null = null;

      if (node?.type === 'html') {
        const match = String(node.value)
          .trim()
          .match(/^<a\s+id=["']([^"']+)["']\s*\/?>(?:<\/a>)?$/i);
        if (match) explicitId = match[1];
      }

      if (node?.type === 'paragraph' && node.children) {
        const meaningful = node.children.filter(
          (c: any) => !(c.type === 'text' && /^[ \t\n]*$/.test(String(c.value)))
        );
        if (
          meaningful.length >= 1 &&
          meaningful.length <= 2 &&
          meaningful.every((c: any) => c.type === 'html')
        ) {
          const combined = meaningful.map((c: any) => String(c.value)).join('');
          const match = combined
            .trim()
            .match(/^<a\s+id=["']([^"']+)["']\s*\/?><\/a>$/i);
          if (match) explicitId = match[1];
        }
      }

      if (explicitId) {
        removeIndexes.push(i);
        for (let j = i + 1; j < children.length; j++) {
          const next = children[j];
          if (next?.type === 'heading') {
            explicitIds.set(next, explicitId);
            break;
          }
          if (
            next?.type !== 'html' &&
            next?.type !== 'text' &&
            next?.type !== 'paragraph'
          )
            break;
        }
      }
    }

    for (let i = removeIndexes.length - 1; i >= 0; i--) {
      children.splice(removeIndexes[i], 1);
    }

    const slugger = new GithubSlugger();
    visit(tree, 'heading', (node: any) => {
      const explicit = explicitIds.get(node);
      const text = getNodeText(node);
      const id = explicit || slugger.slug(text);
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.id = id;
    });
  };
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function parseToc(content: string): TocItem[] {
  const lines = content.split(/\r?\n/);
  const items: TocItem[] = [];
  let pendingId: string | null = null;
  const slugger = new GithubSlugger();

  for (const raw of lines) {
    const line = raw.trim();
    const anchorMatch = line.match(/^<a\s+id=["']([^"']+)["']\s*\/?>\s*<\/a>$/i);
    if (anchorMatch) {
      pendingId = anchorMatch[1];
      continue;
    }

    const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = stripInlineMarkdown(headingMatch[2]);
      const id = pendingId || slugger.slug(text);
      items.push({ level, text, id });
      pendingId = null;
    }
  }

  return items.filter(
    item =>
      item.text.toLowerCase() !== 'table of contents' &&
      item.text !== '目录'
  );
}

function CopyButton({
  text,
  copyLabel,
  copiedLabel,
}: {
  text: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
    }
    window.setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      type="button"
      className="code-copy-btn"
      onClick={handleCopy}
      aria-label={copyLabel}
    >
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}

export default function TutorialPage() {
  const { lang, t } = useLanguage();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const path = lang === 'zh' ? 'tutorials/tutorial_cn.md' : 'tutorials/tutorial.md';
    setLoading(true);
    setError(null);

    fetch(path)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load tutorial: ${res.status}`);
        return res.text();
      })
      .then(text => {
        if (!cancelled) {
          setContent(text);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const toc = useMemo(() => parseToc(content), [content]);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveId(id);
  }, []);

  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .map(e => e.target.id);
        if (visible.length > 0) {
          setActiveId(visible[0]);
        }
      },
      { rootMargin: `-${NAV_HEIGHT}px 0px -70% 0px`, threshold: 0 }
    );

    toc.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  const components = useMemo<Components>(
    () => ({
      code: props => {
        const { inline, className, children } = props as React.HTMLAttributes<HTMLElement> & {
          inline?: boolean;
        };
        if (inline) {
          return <code className={className}>{children}</code>;
        }
        const language = className?.replace('language-', '') || '';
        return (
          <div className="code-block-wrapper">
            {language && (
              <div className="code-block-header">
                <span className="code-language">{language}</span>
                <CopyButton
                  text={String(children).replace(/\n$/, '')}
                  copyLabel={t.tutorial.copy}
                  copiedLabel={t.tutorial.copied}
                />
              </div>
            )}
            <pre className={className}>
              <code className={className}>{children}</code>
            </pre>
          </div>
        );
      },
      a: props => {
        const { href, children, node, ...rest } = props as React.AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps;
        if (href?.startsWith('#')) {
          return (
            <a
              href={href}
              onClick={e => {
                e.preventDefault();
                scrollToId(href.slice(1));
              }}
              {...rest}
            >
              {children}
            </a>
          );
        }
        const external = href?.startsWith('http') ?? false;
        return (
          <a
            href={href}
            {...rest}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {children}
          </a>
        );
      },
    }),
    [scrollToId, t.tutorial.copy, t.tutorial.copied]
  );

  return (
    <div className="tutorial-page">
      <div className="page-header">
        <h1>{t.tutorial.title}</h1>
        <p className="lede">{t.tutorial.subtitle}</p>
      </div>

      <div className="tutorial-layout">
        <div className="tutorial-content card">
          {loading && <div className="tutorial-loading">{t.tutorial.loading}</div>}
          {error && <div className="tutorial-error">{error}</div>}
          {!loading && !error && (
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkHeadingIds]} components={components}>
              {content}
            </ReactMarkdown>
          )}
        </div>

        {toc.length > 0 && (
          <aside className="tutorial-sidebar card">
            <div className="tutorial-sidebar-title">{t.tutorial.onThisPage}</div>
            <nav className="toc-nav">
              <ul className="toc-list">
                {toc.map(item => (
                  <li key={item.id} className={`toc-item toc-level-${item.level}`}>
                    <button
                      type="button"
                      className={`toc-link ${activeId === item.id ? 'active' : ''}`}
                      onClick={() => scrollToId(item.id)}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}
