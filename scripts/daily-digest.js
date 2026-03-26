#!/usr/bin/env node

// ============================================================================
// Daily Digest Automation
// ============================================================================
// Runs daily to:
// 1. Fetch latest data from follow-builders skill
// 2. Generate bilingual digest using LLM
// 3. Save to digests directory
// 4. Push to GitHub (Vercel auto-deploys)
// ============================================================================

import { execSync } from 'child_process';
import { writeFile, mkdir, readdir, readFile } from 'fs/promises';
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
    console.log(`   ✓ ${data.stats?.xBuilders || 0} builders, ${data.stats?.podcastEpisodes || 0} podcasts`);
  } catch (err) {
    console.error('❌ Failed to fetch data:', err.message);
    // Continue with existing data if fetch fails
  }

  // Step 2: Generate digest (this will be done by LLM in production)
  // For now, create a placeholder structure that LLM will fill in
  const digestContent = await generateDigestWithLLM(data);
  
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

async function generateDigestWithLLM(data) {
  // This function formats the data for LLM processing
  // The actual digest generation will be done by the LLM
  // Here we prepare a structured prompt for the LLM
  
  if (!data) {
    return '<p>No data available today.</p>';
  }

  // Format data for bilingual output
  let html = `<div class="digest">
<h2>AI Builders Digest — ${TODAY}</h2>
<h3>X / Twitter</h3>`;

  // Add tweets
  if (data.x && data.x.length > 0) {
    for (const builder of data.x) {
      if (builder.tweets && builder.tweets.length > 0) {
        for (const tweet of builder.tweets) {
          html += `
<div class="item">
  <div class="zh">
    <p><strong>${builder.name}</strong></p>
    <p>${tweet.content_zh || tweet.content}</p>
    ${tweet.url ? `<p><a href="${tweet.url}">原文链接</a></p>` : ''}
  </div>
  <div class="en">
    <p><strong>${builder.name}</strong></p>
    <p>${tweet.content}</p>
    ${tweet.url ? `<p><a href="${tweet.url}">Source</a></p>` : ''}
  </div>
</div>`;
        }
      }
    }
  }

  html += '<h3>Podcasts</h3>';

  // Add podcasts
  if (data.podcasts && data.podcasts.length > 0) {
    for (const podcast of data.podcasts) {
      if (podcast.episodes && podcast.episodes.length > 0) {
        for (const ep of podcast.episodes) {
          html += `
<div class="item">
  <div class="zh">
    <p><strong>${podcast.name}</strong></p>
    <p>${ep.description_zh || ep.description}</p>
    ${ep.url ? `<p><a href="${ep.url}">播客链接</a></p>` : ''}
  </div>
  <div class="en">
    <p><strong>${podcast.name}</strong></p>
    <p>${ep.description}</p>
    ${ep.url ? `<p><a href="${ep.url}">Podcast Link</a></p>` : ''}
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
.digest p { margin: 0 0 12px; }
@media (max-width: 768px) { .digest .item { flex-direction: column; } }
</style>`;

  return html;
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
  
  // Copy all digests from site
  const sourceDigests = await readdir(DIGESTS_DIR);
  for (const file of sourceDigests) {
    const src = join(DIGESTS_DIR, file);
    const dst = join(destDigests, file);
    await copyFile(src, dst);
  }

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

async function copyFile(src, dst) {
  const content = await readFile(src);
  await writeFile(dst, content);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
