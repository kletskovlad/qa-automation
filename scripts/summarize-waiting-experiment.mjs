/**
 * Lab 6. Real Playwright timings and failure counts, never invented.
 * Run: npm run test:e2e:experiment
 * Requires npm install and Playwright browsers.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const baseDir = process.cwd();
const cli = resolve(baseDir, 'node_modules', '@playwright', 'test', 'cli.js');
const resultsDir = resolve(baseDir, 'results', 'lab6');

if (!existsSync(cli)) {
  console.error('Playwright не встановлено. Спочатку запусти npm install.');
  process.exit(1);
}

mkdirSync(resultsDir, { recursive: true });
const variants = [
  { label: 'Явна пауза 1000 мс', slug: 'wait-1000', grep: '@fixed-1000' },
  { label: 'Автоматичне очікування', slug: 'wait-auto', grep: '@auto-wait' },
  { label: 'Явна пауза 5000 мс', slug: 'wait-5000', grep: '@fixed-5000' },
];

const output = [];
for (const variant of variants) {
  console.log(`\n▶ ${variant.label}: 10 повторів у Chromium`);
  const started = Date.now();
  const run = spawnSync(process.execPath, [
    cli, 'test',
    '--config=playwright.experiment.config.ts',
    '--grep', variant.grep,
    '--repeat-each=10', '--workers=1',
    '--project=chromium', '--reporter=json',
  ], {
    cwd: baseDir,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
    timeout: 6 * 60 * 1000,
  });

  if (run.error) {
    console.error(`Не вдалося запустити Playwright: ${run.error.message}`);
    process.exit(1);
  }

  let report;
  try {
    report = JSON.parse(run.stdout);
  } catch {
    console.error('Playwright не повернув JSON-звіт.');
    console.error(run.stdout.slice(-3000));
    console.error(run.stderr.slice(-3000));
    process.exit(1);
  }

  const stats = report.stats ?? {};
  const passed = Number(stats.expected ?? 0);
  const failed = Number(stats.unexpected ?? 0) + Number(stats.flaky ?? 0);
  const skipped = Number(stats.skipped ?? 0);
  const total = passed + failed + skipped;
  const durationSeconds = Number(((Date.now() - started) / 1000).toFixed(2));
  const rawFile = resolve(resultsDir, `${variant.slug}.json`);
  writeFileSync(rawFile, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(`  Пройдено: ${passed}; невдало: ${failed}; пропущено: ${skipped}; усього: ${total}`);
  console.log(`  Загальний час команди: ${durationSeconds} с`);
  if (total !== 10) {
    console.warn(`  Увага: очікувалося 10 прогонів, отримано ${total}. Переглянь ${rawFile}`);
  }
  output.push({ ...variant, passed, failed, skipped, total, durationSeconds, exitCode: run.status });
}

const markdown = [
  '# ЛР №6: результат експерименту (фактичні дані Playwright)',
  '',
  '| Варіант | Невдалих прогонів із 10 | Загальний час |',
  '|---|---:|---:|',
  ...output.map(({ label, failed, durationSeconds }) =>
    `| ${label} | ${failed} | ${durationSeconds} с |`),
  '',
  'Виміряно локально запусками Playwright з `--repeat-each=10 --workers=1`.',
  'Час — фактичний час виконання відповідної команди, включно зі стартом браузера.',
  'Перший і третій варіанти можуть мати падіння; це частина експерименту, а не дефект основного набору.',
  '',
];
writeFileSync(resolve(resultsDir, 'waiting-summary.md'), markdown.join('\n'), 'utf8');
writeFileSync(resolve(resultsDir, 'waiting-summary.csv'),
  'variant,failed,total,duration_seconds\n' +
  output.map((v) => `${v.slug},${v.failed},${v.total},${v.durationSeconds}`).join('\n') + '\n',
  'utf8',
);
console.log('\nГотово: results/lab6/waiting-summary.md та .csv');
console.log('Числа взято з реальних запусків, не задано наперед.');
