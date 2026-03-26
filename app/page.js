import fs from 'fs';
import path from 'path';

export default async function Home() {
  const digests = await getDigests();
  const latestDigest = digests[0];
  
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div>
      {/* 将数据注入到页面中供客户端使用 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__DIGESTS__ = ${JSON.stringify(digests.map(d => ({date: d.date, stats: d.stats})))};`
        }}
      />
      
      <div id="root" data-latest={latestDigest ? latestDigest.date : ''}>
        {/* 初始内容 - 服务器端渲染 */}
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
            <main style={{ flex: '1', minWidth: 0 }}>
              {latestDigest ? (
                <>
                  <h2 style={{
                    fontSize: '24px',
                    marginBottom: '20px',
                    color: '#000'
                  }}>
                    {formatDate(latestDigest.date)}
                  </h2>
                  <div
                    dangerouslySetInnerHTML={{ __html: latestDigest.content }}
                    style={{
                      fontSize: '15px',
                      lineHeight: '1.8'
                    }}
                  />
                </>
              ) : (
                <p style={{ color: '#999' }}>暂无简报</p>
              )}
            </main>

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
                      href={`?date=${digest.date}`}
                      className="date-link"
                      data-date={digest.date}
                      style={{
                        fontSize: '13px',
                        color: '#666',
                        fontWeight: '400',
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
      </div>
      
      {/* 客户端交互脚本 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  function formatDate(date) {
    var d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }
  
  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
  
  function setQueryParam(name, value) {
    var url = new URL(window.location);
    if (value) {
      url.searchParams.set(name, value);
    } else {
      url.searchParams.delete(name);
    }
    window.history.pushState({}, '', url);
  }
  
  var digests = window.__DIGESTS__ || [];
  var links = document.querySelectorAll('.date-link');
  
  function updateActiveLink() {
    var activeDate = getQueryParam('date') || (digests[0] && digests[0].date);
    links.forEach(function(link) {
      if (link.getAttribute('data-date') === activeDate) {
        link.style.color = '#0066cc';
        link.style.fontWeight = '600';
      } else {
        link.style.color = '#666';
        link.style.fontWeight = '400';
      }
    });
  }
  
  links.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var date = this.getAttribute('data-date');
      setQueryParam('date', date);
      updateActiveLink();
    });
  });
  
  updateActiveLink();
})();
          `
        }}
      />
    </div>
  );
}

async function getDigests() {
  const digestsDir = path.join(process.cwd(), 'digests');
  const digests = [];

  if (fs.existsSync(digestsDir)) {
    const files = fs.readdirSync(digestsDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    for (const file of files) {
      const filePath = path.join(digestsDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      digests.push(data);
    }
  }

  return digests;
}
