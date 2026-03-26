import fs from 'fs';
import path from 'path';

export default async function Home() {
  const digests = await getDigests();
  
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 默认显示最新的
  const defaultDigest = digests[0];

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
        <main style={{ flex: '1', minWidth: 0 }}>
          {defaultDigest ? (
            <>
              <h2 style={{
                fontSize: '24px',
                marginBottom: '20px',
                color: '#000'
              }}>
                {formatDate(defaultDigest.date)}
              </h2>
              <div
                dangerouslySetInnerHTML={{ __html: defaultDigest.content }}
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
                  href={`#${digest.date}`}
                  className="date-link"
                  data-date={digest.date}
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

      {/* 数据存储 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.__ALL_DIGESTS__ = ${JSON.stringify(digests)};
          `
        }}
      />
      
      {/* 切换逻辑 */}
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
              
              function showDigest(date, digests) {
                var digest = digests.find(function(d) { return d.date === date; }) || digests[0];
                if (!digest) return;
                
                // 更新标题
                var main = document.querySelector('main');
                main.innerHTML = '<h2 style="font-size:24px;margin-bottom:20px;color:#000;">' + 
                  formatDate(digest.date) + '</h2><div style="font-size:15px;line-height:1.8;">' + 
                  digest.content + '</div>';
                
                // 更新侧边栏高亮
                var links = document.querySelectorAll('.date-link');
                links.forEach(function(link) {
                  if (link.getAttribute('data-date') === date) {
                    link.style.color = '#0066cc';
                    link.style.fontWeight = '600';
                  } else {
                    link.style.color = '#666';
                    link.style.fontWeight = '400';
                  }
                });
              }
              
              var digests = window.__ALL_DIGESTS__ || [];
              
              // 绑定点击事件
              document.querySelectorAll('.date-link').forEach(function(link) {
                link.addEventListener('click', function(e) {
                  e.preventDefault();
                  var date = this.getAttribute('data-date');
                  window.location.hash = date;
                  showDigest(date, digests);
                });
              });
              
              // 初始显示
              var hash = window.location.hash.slice(1);
              if (hash) {
                showDigest(hash, digests);
              }
              
              // 监听 hash 变化
              window.addEventListener('hashchange', function() {
                var newHash = window.location.hash.slice(1);
                if (newHash) {
                  showDigest(newHash, digests);
                }
              });
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
