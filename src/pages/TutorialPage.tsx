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

interface AdmonitionInfo {
  type: string;
  title: string;
}

const NAV_HEIGHT = 80;

const ADMONITION_LABELS: Record<string, string[]> = {
  note: ['Note', '注意'],
  warning: ['Warning', '警告'],
  tip: ['Tip', '提示'],
  important: ['Important', '重要'],
  beginner: ['Beginner note', 'Beginner tip', '初学者提示'],
};

const ADMONITION_ICONS: Record<string, string> = {
  note: '📝',
  warning: '⚠️',
  tip: '💡',
  important: '🔴',
  beginner: '🎓',
};

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

function detectAdmonition(text: string): AdmonitionInfo | null {
  for (const [type, labels] of Object.entries(ADMONITION_LABELS)) {
    for (const label of labels) {
      const pattern = new RegExp(`^${label}\\s*[:：]?\\s*(.*)$`, 'i');
      const match = text.match(pattern);
      if (match) {
        return { type, title: match[1] ? `${label}: ${match[1]}` : label };
      }
    }
  }
  return null;
}

function remarkAdmonitions() {
  return (tree: any) => {
    visit(tree, 'blockquote', (node: any) => {
      const firstPara = node.children?.find((c: any) => c.type === 'paragraph');
      if (!firstPara?.children?.length) return;

      const firstChild = firstPara.children[0];
      if (firstChild?.type !== 'strong') return;

      const labelText = getNodeText(firstChild);
      const info = detectAdmonition(labelText);
      if (!info) return;

      // Remove the strong label and any trailing colon/whitespace from the paragraph
      firstPara.children.shift();
      while (
        firstPara.children.length > 0 &&
        firstPara.children[0].type === 'text' &&
        /^\s*[:：]?\s*$/.test(String(firstPara.children[0].value))
      ) {
        firstPara.children.shift();
      }

      // If the paragraph is now empty, remove it
      if (firstPara.children.length === 0) {
        node.children = node.children.filter((c: any) => c !== firstPara);
      }

      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.className = ['admonition', `admonition-${info.type}`];
      node.data.hProperties['data-admonition-title'] = info.title;
      node.data.hProperties['data-admonition-type'] = info.type;
    });
  };
}

function remarkParameterItems() {
  return (tree: any) => {
    visit(tree, 'listItem', (node: any) => {
      const firstChild = node.children?.[0];
      if (!firstChild || firstChild.type !== 'paragraph') return;

      const paraChildren = firstChild.children;
      if (!paraChildren?.length || paraChildren[0].type !== 'strong') return;

      const name = getNodeText(paraChildren[0]).trim();
      // Only treat identifier-like keys as parameters; skip Chinese labels or sentences.
      if (!name || !/^[A-Za-z_][A-Za-z0-9_.]*$/.test(name)) return;

      const nextNode = paraChildren[1];
      if (!nextNode || nextNode.type !== 'text') return;

      const nextText = String(nextNode.value);
      // Accept em-dash, hyphen, or ASCII colon; reject full-width colon used in prose lists.
      const separatorMatch = nextText.match(/^(\s*[:—\-]\s*)/);
      if (!separatorMatch) return;

      // Remove the separator from the text node
      const separatorLen = separatorMatch[1].length;
      nextNode.value = nextText.slice(separatorLen);
      if (nextNode.value === '') {
        paraChildren.splice(1, 1);
      }

      // Remove the strong node (we'll render the name separately)
      paraChildren.shift();

      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.className = ['param-item'];
      node.data.hProperties['data-param-name'] = name;
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

function Admonition({
  type,
  title,
  children,
}: {
  type?: string;
  title?: string;
  children: React.ReactNode;
}) {
  const kind = type || 'note';
  return (
    <div className={`admonition admonition-${kind}`}>
      <div className="admonition-header">
        <span className="admonition-icon" aria-hidden="true">
          {ADMONITION_ICONS[kind] || ADMONITION_ICONS.note}
        </span>
        <span className="admonition-title">{title || kind}</span>
      </div>
      <div className="admonition-content">{children}</div>
    </div>
  );
}

function TaskComparisonCards({ node }: { node: any }) {
  const rows = node?.children || [];
  if (rows.length < 2) return null;

  const headers = (rows[0].children || []).map((cell: any) => getNodeText(cell));
  const dataRows = rows.slice(1).map((row: any) =>
    (row.children || []).map((cell: any) => getNodeText(cell))
  );

  const taskIndex = headers.findIndex((h: string) => /task|任务/i.test(h));
  const inputIndex = headers.findIndex((h: string) => /input|输入/i.test(h));
  const scriptsIndex = headers.findIndex((h: string) => /script|入口/i.test(h));
  const configIndex = headers.findIndex((h: string) => /config|配置/i.test(h));
  const diffIndex = headers.findIndex((h: string) => /difference|差异/i.test(h));

  return (
    <div className="task-comparison-grid">
      {dataRows.map((row: string[], i: number) => (
        <div key={i} className="card task-comparison-card">
          <div className="task-comparison-header">
            <span className="task-comparison-icon">{['🌊', '⛰️', '🌀', '🔲'][i % 4]}</span>
            <span className="task-comparison-name">{row[taskIndex] || `Task ${i + 1}`}</span>
          </div>
          <div className="task-comparison-body">
            {inputIndex >= 0 && row[inputIndex] && (
              <div className="task-comparison-row">
                <span className="task-comparison-label">{headers[inputIndex]}</span>
                <span className="task-comparison-value">{row[inputIndex]}</span>
              </div>
            )}
            {scriptsIndex >= 0 && row[scriptsIndex] && (
              <div className="task-comparison-row">
                <span className="task-comparison-label">{headers[scriptsIndex]}</span>
                <span className="task-comparison-value">{row[scriptsIndex]}</span>
              </div>
            )}
            {configIndex >= 0 && row[configIndex] && (
              <div className="task-comparison-row">
                <span className="task-comparison-label">{headers[configIndex]}</span>
                <span className="task-comparison-value">{row[configIndex]}</span>
              </div>
            )}
            {diffIndex >= 0 && row[diffIndex] && (
              <div className="task-comparison-row">
                <span className="task-comparison-label">{headers[diffIndex]}</span>
                <span className="task-comparison-value">{row[diffIndex]}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function ParamItem({
  name,
  children,
}: {
  name?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="param-item">
      {name && <span className="param-name">{name}</span>}
      <span className="param-body">{children}</span>
    </li>
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
        const { inline, className, children, node } = props as React.HTMLAttributes<HTMLElement> &
          ExtraProps & { inline?: boolean };
        if (inline) {
          return <code className={className}>{children}</code>;
        }
        const language = className?.replace('language-', '') || '';
        const meta = String((node as any)?.meta || '');
        const filenameMatch = meta.match(/filename=["']([^"']+)["']/);
        const filename = filenameMatch?.[1];
        const rawText = String(children).replace(/\n$/, '');

        if (language === 'math') {
          return (
            <div className="formula-block">
              <div className="formula-content">{rawText}</div>
              <CopyButton
                text={rawText}
                copyLabel={t.tutorial.copy}
                copiedLabel={t.tutorial.copied}
              />
            </div>
          );
        }

        if (language === 'tree') {
          return (
            <div className="file-tree-wrapper">
              <pre className="file-tree">
                <code>{children}</code>
              </pre>
              <CopyButton
                text={rawText}
                copyLabel={t.tutorial.copy}
                copiedLabel={t.tutorial.copied}
              />
            </div>
          );
        }

        return (
          <div className="code-block-wrapper">
            {(language || filename) && (
              <div className="code-block-header">
                <div className="code-block-header-left">
                  {filename && <span className="code-filename">{filename}</span>}
                  {language && <span className="code-language">{language}</span>}
                </div>
                <CopyButton
                  text={rawText}
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
      blockquote: props => {
        const { node, children } = props as React.BlockquoteHTMLAttributes<HTMLQuoteElement> & ExtraProps;
        const data = (node as any)?.data?.hProperties || {};
        const className = data.className;
        const type = data['data-admonition-type'];
        const title = data['data-admonition-title'];
        if (Array.isArray(className) && className.includes('admonition')) {
          return <Admonition type={type} title={title}>{children}</Admonition>;
        }
        return <blockquote>{children}</blockquote>;
      },
      li: props => {
        const { node, children } = props as React.LiHTMLAttributes<HTMLLIElement> & ExtraProps;
        const data = (node as any)?.data?.hProperties || {};
        const className = data.className;
        const name = data['data-param-name'];
        if (Array.isArray(className) && className.includes('param-item')) {
          return <ParamItem name={name}>{children}</ParamItem>;
        }
        return <li>{children}</li>;
      },
      table: props => {
        const { node, children } = props as React.TableHTMLAttributes<HTMLTableElement> & ExtraProps;
        const rows = (node as any)?.children || [];
        const firstHeader = rows[0]?.children?.[0] ? getNodeText(rows[0].children[0]) : '';
        const isTaskTable = /task|任务/i.test(firstHeader);
        if (isTaskTable) {
          return (
            <>
              <div className="task-comparison-table-wrapper">{children}</div>
              <TaskComparisonCards node={node} />
            </>
          );
        }
        return <table>{children}</table>;
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
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkHeadingIds, remarkAdmonitions, remarkParameterItems]} components={components}>
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
