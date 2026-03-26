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

  return (
    <div>
      {/* 将所有 digest 数据注入到页面中 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.__ALL_DIGESTS__ = ${JSON.stringify(digests)};
          `
        }}
      />
      
      <div id="app-root">
        {/* 初始 HTML - 服务器端渲染 */}
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
            <main style={{ flex: '1', minWidth: 0 }} id="main-content">
              {/* 内容由客户端 JS 渲染 */}
            </main>

            <aside style={{
              width: '200px',
              flexShrink: 0,
              borderLeft: '1px solid #e5e5e5',
              paddingLeft: '20px'
            }} id="sidebar">
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
              }} id="date-list">
                {/* 日期列表由客户端 JS 渲染 */}
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
  
  var digests = window.__ALL_DIGESTS__ || [];
  
  // 渲染侧边栏日期列表
  function renderSidebar(activeDate) {
    var list = document.getElementById('date-list');
    if (!list) return;
    
    list.innerHTML = '';
    digests.forEach(function(digest) {
      var li = document.createElement('li');
      li.style.marginBottom = '10px';
      
      var a = document.createElement('a');
      a.href = '?date=' + digest.date;
      a.setAttribute('data-date', digest.date);
      a.style.fontSize = '13px';
      a.style.color = digest.date === activeDate ? '#0066cc' : '#666';
      a.style.fontWeight = digest.date === activeDate ? '600' : '400';
      a.style.textDecoration = 'none';
      a.style.cursor = 'pointer';
      a.textContent = formatDate(digest.date);
      
      a.addEventListener('click', function(e) {
        e.preventDefault();
        var date = this.getAttribute('data-date');
        setQueryParam('date', date);
        render();
      });
      
      li.appendChild(a);
      list.appendChild(li);
    });
  }
  
  // 渲染主内容
  function renderMain(activeDate) {
    var main = document.getElementById('main-content');
    if (!main) return;
    
    var digest = digests.find(function(d) { return d.date === activeDate; }) || digests[0];
    
    if (!digest) {
      main.innerHTML = '<p style=\\"color:#999\\">暂无简报</p>';
      return;
    }
    
    main.innerHTML = 
      '<h2 style=\\"font-size:24px;margin-bottom:20px;color:#000;\\">' + 
      formatDate(digest.date) + 
      '</h2><div style=\\"font-size:15px;line-height:1.8;\\">' + 
      digest.content + 
      '</div>';
  }
  
  // 完整渲染
  function render() {
    var activeDate = getQueryParam('date') || (digests[0] && digests[0].date);
    renderSidebar(activeDate);
    renderMain(activeDate);
  }
  
  // 监听 URL 变化
  window.addEventListener('popstate', render);
  
  // 初始渲染
  render();
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
