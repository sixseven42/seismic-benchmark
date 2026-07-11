import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from '../contexts/LanguageContext';
import './TutorialPage.css';

export default function TutorialPage() {
  const { lang, t } = useLanguage();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    return () => { cancelled = true; };
  }, [lang]);

  return (
    <div className="tutorial-page">
      <div className="page-header">
        <h1>{t.tutorial.title}</h1>
        <p className="lede">{t.tutorial.subtitle}</p>
      </div>

      <div className="tutorial-content card">
        {loading && <div className="tutorial-loading">{t.tutorial.loading}</div>}
        {error && <div className="tutorial-error">{error}</div>}
        {!loading && !error && (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
