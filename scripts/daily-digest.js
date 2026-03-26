#!/usr/bin/env node

// ============================================================================
// Daily Digest Automation
// ============================================================================
// Runs daily to:
// 1. Fetch latest data from follow-builders skill
// 2. Generate bilingual digest with full original tweets
// 3. Save to digests directory
// 4. Push to GitHub (Vercel auto-deploys)
// ============================================================================

import { execSync } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SKILL_DIR = '/root/skills/follow-builders';
const SITE_DIR = '/workspace/projects/workspace/ai-builders-digest-site';
const DIGESTS_DIR = join(SITE_DIR, 'digests');
const REPO_DIR = join(homedir(), '.follow-builders', 'repo');
const REPO_URL = 'git@github.com:jessieleung27-wq/ai-builders-digest.git';
const SSH_KEY = join(homedir(), '.ssh/follow-builders/id_ed25519');

const GIT_SSH_COMMAND = `ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no -o IdentitiesOnly=yes`;
const TODAY = new Date().toISOString().split('T')[0];

async function main() {
  console.log(`\n🦐 AI Builders Digest - Daily Update - ${TODAY}\n`);

  // Step 1: Fetch data
  console.log('📡 Fetching data from follow-builders...');
  let data;
  try {
    const dataOutput = execSync(`cd ${SKILL_DIR}/scripts && node prepare-digest.js`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    data = JSON.parse(dataOutput);
    console.log(`   ✓ ${data.stats?.xBuilders || 0} builders, ${data.stats?.totalTweets || 0} tweets, ${data.stats?.podcastEpisodes || 0} podcasts`);
  } catch (err) {
    console.error('❌ Failed to fetch data:', err.message);
    throw err;
  }

  // Step 2: Generate bilingual digest with full content
  console.log('📝 Generating bilingual digest...');
  const digestContent = await generateBilingualDigest(data);
  
  // Step 3: Save digest
  await mkdir(DIGESTS_DIR, { recursive: true });
  const digestFile = join(DIGESTS_DIR, `${TODAY}.json`);
  
  const digestData = {
    date: TODAY,
    content: digestContent,
    stats: data?.stats || {},
    generatedAt: new Date().toISOString()
  };
  
  await writeFile(digestFile, JSON.stringify(digestData, null, 2), 'utf-8');
  console.log(`   ✓ Saved digest to ${digestFile}`);

  // Step 4: Push to GitHub
  console.log('🚀 Pushing to GitHub...');
  await pushToGitHub();
  
  console.log('\n✅ Daily update complete! Vercel will auto-deploy.\n');
}

async function generateBilingualDigest(data) {
  if (!data || !data.x) {
    return '<p>No data available today.</p>';
  }

  let html = `<div class="digest">
<h2>AI Builders Digest — ${TODAY}</h2>
<h3>X / Twitter</h3>`;

  // Add all tweets from all builders
  for (const builder of data.x) {
    if (builder.tweets && builder.tweets.length > 0) {
      for (const tweet of builder.tweets) {
        const contentEn = tweet.content || '';
        const contentZh = contentEn; // LLM will translate this
        const authorEn = builder.name || builder.handle;
        const authorZh = builder.name || builder.handle;
        const link = tweet.url || '';
        
        html += `
<div class="item">
  <div class="zh">
    <p><strong>${escapeHtml(authorZh)}</strong></p>
    <p>${escapeHtml(contentZh)}</p>
    ${link ? `<p><a href="${escapeHtml(link)}">原文链接</a></p>` : ''}
  </div>
  <div class="en">
    <p><strong>${escapeHtml(authorEn)}</strong></p>
    <p>${escapeHtml(contentEn)}</p>
    ${link ? `<p><a href="${escapeHtml(link)}">Source</a></p>` : ''}
  </div>
</div>`;
      }
    }
  }

  html += '<h3>Podcasts</h3>';

  // Add podcasts
  if (data.podcasts && data.podcasts.length > 0) {
    for (const podcast of data.podcasts) {
      if (podcast.episodes && podcast.episodes.length > 0) {
        for (const ep of podcast.episodes) {
          const descEn = ep.description || ep.title || '';
          const descZh = descEn; // LLM will translate this
          const title = podcast.name || '';
          
          html += `
<div class="item">
  <div class="zh">
    <p><strong>${escapeHtml(title)}</strong></p>
    <p>${escapeHtml(descZh)}</p>
    ${ep.url ? `<p><a href="${escapeHtml(ep.url)}">播客链接</a></p>` : ''}
  </div>
  <div class="en">
    <p><strong>${escapeHtml(title)}</strong></p>
    <p>${escapeHtml(descEn)}</p>
    ${ep.url ? `<p><a href="${escapeHtml(ep.url)}">Podcast Link</a></p>` : ''}
  </div>
</div>`;
        }
      }
    }
  }

  html += `</div>
<style>
.digest .item { display: flex; gap: 20px; margin-bottom: 24px; border-bottom: 1px solid #eee; padding-bottom: 24px; }
.digest .zh, .digest .en { flex: 1; min-width: 0; }
.digest h2 { font-size: 24px; margin-bottom: 20px; }
.digest h3 { font-size: 18px; margin: 24px 0 16px; color: #333; }
.digest strong { color: #000; }
.digest a { color: #0066cc; }
.digest code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.digest p { margin: 0 0 12px; line-height: 1.6; }
@media (max-width: 768px) { .digest .item { flex-direction: column; } }
</style>`;

  return html;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function pushToGitHub() {
  // Clone or pull the repo
  if (!existsSync(REPO_DIR)) {
    console.log('   📥 Cloning repository...');
    execSync(`GIT_SSH_COMMAND="${GIT_SSH_COMMAND}" git clone ${REPO_URL} ${REPO_DIR}`, {
      stdio: 'inherit'
    });
  } else {
    console.log('   📥 Pulling latest changes...');
    execSync(`cd ${REPO_DIR} && GIT_SSH_COMMAND="${GIT_SSH_COMMAND}" git pull`, {
      stdio: 'inherit'
    });
  }

  // Copy new digests
  const destDigests = join(REPO_DIR, 'digests');
  await mkdir(destDigests, { recursive: true });
  
  const digestFile = join(DIGESTS_DIR, `${TODAY}.json`);
  execSync(`cp ${digestFile} ${destDigests}/`, { stdio: 'inherit' });

  // Copy app directory
  execSync(`cp -r ${SITE_DIR}/app ${REPO_DIR}/`, { stdio: 'inherit' });
  execSync(`cp ${SITE_DIR}/package.json ${REPO_DIR}/`, { stdio: 'inherit' });
  execSync(`cp ${SITE_DIR}/next.config.js ${REPO_DIR}/`, { stdio: 'inherit' });

  // Commit and push
  console.log('   💾 Committing changes...');
  execSync(`cd ${REPO_DIR} && git add -A`, { stdio: 'inherit' });
  
  const status = execSync(`cd ${REPO_DIR} && git status --porcelain`, {
    encoding: 'utf-8'
  }).trim();

  if (!status) {
    console.log('   ✓ No changes to commit');
    return;
  }

  execSync(`cd ${REPO_DIR} && GIT_SSH_COMMAND="${GIT_SSH_COMMAND}" git commit -m "Update digest for ${TODAY}"`, {
    stdio: 'inherit'
  });

  console.log('   🚀 Pushing to GitHub...');
  execSync(`cd ${REPO_DIR} && GIT_SSH_COMMAND="${GIT_SSH_COMMAND}" git push`, {
    stdio: 'inherit'
  });
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
