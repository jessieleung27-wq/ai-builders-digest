#!/usr/bin/env node

// ============================================================================
// Push Digest to GitHub
// ============================================================================
// Runs after digest generation to push to GitHub repository
// Usage: node scripts/push-to-github.js
// ============================================================================

import { execSync } from 'child_process';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const REPO_DIR = join(homedir(), '.follow-builders', 'repo');
const DIGESTS_DIR = join(REPO_DIR, 'digests');
const REPO_URL = 'git@github.com:jessieleung27-wq/ai-builders-digest.git';
const SSH_KEY = join(homedir(), '.ssh/follow-builders/id_ed25519');

// Git SSH 配置
const GIT_SSH_COMMAND = `ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no -o IdentitiesOnly=yes`;

async function main() {
  const today = new Date().toISOString().split('T')[0];
  const digestFile = join(homedir(), '.follow-builders', `digest-${today}.md`);

  console.log('📝 Reading digest...');

  if (!existsSync(digestFile)) {
    console.log('❌ No digest found for today');
    process.exit(1);
  }

  const digestContent = await readFile(digestFile, 'utf-8');

  // 读取统计数据
  let stats = {};
  const statsFile = join(homedir(), '.follow-builders', 'digest-stats.json');
  if (existsSync(statsFile)) {
    stats = JSON.parse(await readFile(statsFile, 'utf-8'));
  }

  // 准备推送到 GitHub 的数据
  const digestData = {
    date: today,
    content: digestContent,
    stats: stats
  };

  console.log('📦 Preparing repository...');

  // 检查仓库目录
  if (!existsSync(REPO_DIR)) {
    console.log('📥 Cloning repository...');
    execSync(`GIT_SSH_COMMAND="${GIT_SSH_COMMAND}" git clone ${REPO_URL} ${REPO_DIR}`, {
      stdio: 'inherit'
    });
  } else {
    // 拉取最新代码
    console.log('📥 Pulling latest changes...');
    execSync(`cd ${REPO_DIR} && GIT_SSH_COMMAND="${GIT_SSH_COMMAND}" git pull`, {
      stdio: 'inherit'
    });
  }

  // 确保 digests 目录存在
  if (!existsSync(DIGESTS_DIR)) {
    mkdir(DIGESTS_DIR, { recursive: true });
  }

  // 写入今天的简报
  const targetFile = join(DIGESTS_DIR, `${today}.json`);
  await writeFile(targetFile, JSON.stringify(digestData, null, 2), 'utf-8');

  // 拷贝网站文件到仓库
  const siteDir = '/workspace/projects/workspace/ai-builders-digest-site';
  execSync(`cp -r ${siteDir}/app ${REPO_DIR}/`, { stdio: 'inherit' });
  execSync(`cp ${siteDir}/package.json ${REPO_DIR}/`, { stdio: 'inherit' });
  execSync(`cp ${siteDir}/next.config.js ${REPO_DIR}/`, { stdio: 'inherit' });

  // Git 操作
  console.log('🚀 Committing and pushing...');
  execSync(`cd ${REPO_DIR} && git add -A`, { stdio: 'inherit' });

  const gitStatus = execSync(`cd ${REPO_DIR} && git status --porcelain`, {
    encoding: 'utf-8'
  }).trim();

  if (!gitStatus) {
    console.log('✅ No changes to commit');
    return;
  }

  execSync(`cd ${REPO_DIR} && GIT_SSH_COMMAND="${GIT_SSH_COMMAND}" git commit -m "Update digest for ${today}"`, {
    stdio: 'inherit'
  });

  execSync(`cd ${REPO_DIR} && GIT_SSH_COMMAND="${GIT_SSH_COMMAND}" git push`, {
    stdio: 'inherit'
  });

  console.log('✅ Digest pushed to GitHub successfully!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
