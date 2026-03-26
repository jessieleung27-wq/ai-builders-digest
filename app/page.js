'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [digests, setDigests] = useState([]);
  const [activeDate, setActiveDate] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 从 URL hash 获取初始日期
    const hash = window.location.hash.slice(1);
    
    // 获取所有日期
    fetch('/digests.json')
      .then(res => res.json())
      .then(data => {
        setDigests(data);
        if (hash && data.find(d => d.date === hash)) {
          setActiveDate(hash);
        } else if (data.length > 0) {
          setActiveDate(data[0].date);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    
    // 监听 hash 变化
    const handleHashChange = () => {
      const newHash = window.location.hash.slice(1);
      if (newHash && digests.find(d => d.date === newHash)) {
        setActiveDate(newHash);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };
  
  const activeDigest = activeDate 
    ? digests.find(d => d.date === activeDate)
    : (digests[0] || null);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!activeDigest) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>暂无简报</div>;
  }

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      color: '#333'
    }}>
      <header style={{
        marginBottom: '40px',
        borderBottom: '2px solid #e5e5e5',
        paddingBottom: '20px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '10px',
          color: '#000'
        }}>
          AI Builders Digest
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          margin: 0
        }}>
          跟踪顶尖 AI builders 的最新观点和动态
        </p>
      </header>

      <div style={{ display: 'flex', gap: '40px' }}>
        {/* 主内容区 */}
        <main style={{ flex: '1', minWidth: 0 }}>
          <h2 style={{
            fontSize: '24px',
            marginBottom: '20px',
            color: '#000'
          }}>
            {formatDate(activeDigest.date)}
          </h2>
          <div
            dangerouslySetInnerHTML={{ __html: activeDigest.content }}
            style={{
              fontSize: '15px',
              lineHeight: '1.8'
            }}
          />
        </main>

        {/* 侧边栏 - 历史记录 */}
        <aside style={{
          width: '200px',
          flexShrink: 0,
          borderLeft: '1px solid #e5e5e5',
          paddingLeft: '20px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '15px',
            color: '#666'
          }}>
            历史简报
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            {digests.map((digest) => (
              <li key={digest.date} style={{ marginBottom: '10px' }}>
                <a
                  href={`#${digest.date}`}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = digest.date;
                    setActiveDate(digest.date);
                  }}
                  style={{
                    fontSize: '13px',
                    color: digest.date === activeDate ? '#0066cc' : '#666',
                    fontWeight: digest.date === activeDate ? '600' : '400',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {formatDate(digest.date)}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <footer style={{
        marginTop: '60px',
        paddingTop: '20px',
        borderTop: '1px solid #e5e5e5',
        fontSize: '12px',
        color: '#999',
        textAlign: 'center'
      }}>
        Generated through the Follow Builders skill
      </footer>
    </div>
  );
}
