/**
 * Apply the 2026-06-23 data refresh to data/programs.json.
 *
 * Reads data/refresh-2026-06-23.json (101 researched records, each with sources)
 * and patches the time-sensitive factual fields of each program:
 *   deadline, start_date, duration, tuition/fees/scholarship (+ recomputed cost
 *   display fields), national_percentile, additional prereqs, verification +
 *   research metadata, and an accepting-status flag in notes.
 *
 * It does NOT recompute scores — run `node data/sync-programs.js` afterward,
 * which re-derives competitiveness/cost_score/raw_score/rank from these inputs.
 *
 * Idempotent: re-running with the same refresh file produces the same result.
 * Self-check: run with `--check` to assert the recompute math on one record.
 */

const fs = require('fs');
const path = require('path');

const PROGRAMS = path.join(__dirname, 'data', 'programs.json');
const REFRESH = path.join(__dirname, 'data', 'refresh-2026-06-23.json');
const STAMP = '2026-06-23';

// Recompute the Excel-style cost display fields from the primary cost inputs.
// Mirrors the formula in data/sync-programs.js so the displayed burn matches the
// scored burn. COL Index and the $1500 living base are preserved as-is.
function recomputeCosts(costs, durationMonths) {
  const tuition = num(costs.Tuition);
  const fees = num(costs.Fees);
  const schol = num(costs['Schlrshp Amt']);
  const colIndex = (num(costs['COL Index']) || 100) / 100;
  const duration = durationMonths || num(costs['Duration (mo)']) || 12;
  const netTuition = tuition + fees - schol;
  const totalLiving = Math.round(1500 * colIndex * duration);
  const totalCost = netTuition + totalLiving;
  const moBurn = Math.round(totalCost / duration);
  const costScore = Math.max(0, Math.round((1 - moBurn / 10000) * 100) / 100);
  costs['Net Tuition'] = netTuition;
  costs['Duration (mo)'] = duration;
  costs['Living $/mo'] = num(costs['Living $/mo']) || 1500;
  costs['Total Living'] = totalLiving;
  costs['Total Cost'] = totalCost;
  costs['Mo. Burn'] = moBurn;
  costs['Cost Score'] = costScore;
}

function num(v) { return typeof v === 'number' ? v : 0; }
function clip(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

// Build the freeform notes (UI display; engine never parses this).
function buildNotes(r, ruleOut) {
  let prefix = '';
  if (ruleOut) {
    prefix = '[DISCONTINUED at this location as of ' + STAMP + ' — ruled out.] ';
  } else if (r.accepting_spring_2027 === false) {
    prefix = '[NO SPRING 2027 (Jan) COHORT — next start ' + (r.start_date || 'TBD') + '; listed for comparison.] ';
  } else if (r.accepting_spring_2027 !== true) {
    prefix = '[SPRING 2027 COHORT UNCONFIRMED — verify with school.] ';
  }
  const src = (r.sources && r.sources[0]) ? ' Source: ' + r.sources[0] + '.' : '';
  return clip(prefix + (r.notes || '') + src + ' [Refreshed ' + STAMP + ']', 900);
}

// Build verification.notes. CONTROLLED string only — the plan-fit engine rules a
// program out when this contains "NOT ACCEPTING" / "NOT CURRENTLY ACCEPTING", so we
// emit that phrase ONLY for genuinely discontinued rows and never elsewhere.
function buildVerificationNotes(r, ruleOut) {
  if (ruleOut) {
    return 'NOT ACCEPTING APPLICATIONS at this location — program discontinued or restructured (verified ' + STAMP + ').';
  }
  if (r.accepting_spring_2027 === false) {
    return 'No January/Spring 2027 cohort — Fall/Summer-start only; next start ' + (r.start_date || 'TBD') + ' (verified ' + STAMP + ').';
  }
  if (r.accepting_spring_2027 !== true) {
    return 'Spring 2027 cohort unconfirmed — verify directly with the school (checked ' + STAMP + ').';
  }
  return 'Verified current for a Spring 2027 (January) cohort on ' + STAMP + '.';
}

const confMap = { high: 'verified', medium: 'likely', low: 'tentative' };

function applyOne(p, r) {
  const ruleOut = r.still_active === false && r.accepting_spring_2027 === false;

  // --- admissions ---
  p.admissions = p.admissions || {};
  p.admissions.deadline = (r.deadline === undefined) ? p.admissions.deadline : r.deadline;
  if (r.start_date) p.admissions.start_date = r.start_date;
  if (r.deadline == null) {
    p.admissions.rolling_admissions = true;
    p.admissions.app_timing_notes = 'Rolling / no fixed published deadline (verified ' + STAMP + ').';
  } else {
    p.admissions.rolling_admissions = false;
  }

  // --- duration ---
  if (typeof r.duration_months === 'number') {
    p.program_details = p.program_details || {};
    p.program_details.duration_months = r.duration_months;
  }

  // --- costs (primary inputs + recomputed display fields) ---
  p.costs = p.costs || {};
  if (typeof r.tuition_total === 'number') p.costs.Tuition = r.tuition_total;
  if (typeof r.fees === 'number') p.costs.Fees = r.fees;
  if (typeof r.scholarship_amt === 'number') p.costs['Schlrshp Amt'] = r.scholarship_amt;
  recomputeCosts(p.costs, p.program_details && p.program_details.duration_months);

  // --- scores: national_percentile feeds competitiveness in sync-programs.js ---
  if (typeof r.national_percentile === 'number') {
    p.scores = p.scores || {};
    p.scores.national_percentile = r.national_percentile;
  }

  // --- prerequisites.additional (human-readable; `extra` array left untouched so
  //     the plan-fit engine + prereq-map keep working) ---
  if (typeof r.prereqs_additional === 'string') {
    const keepOld = r.prereqs_additional === '' && r.confidence === 'low';
    if (!keepOld) {
      p.prerequisites = p.prerequisites || {};
      p.prerequisites.additional = r.prereqs_additional;
    }
  }

  // --- notes ---
  p.notes = buildNotes(r, ruleOut);

  // --- verification ---
  p.verification = p.verification || { priority: 'normal' };
  p.verification.last_verified = STAMP;
  p.verification.confidence = confMap[r.confidence] || 'partial';
  p.verification.sources = p.verification.sources || {};
  if (r.sources && r.sources[0]) p.verification.sources.primary = r.sources[0];
  p.verification.notes = buildVerificationNotes(r, ruleOut);

  // --- research metadata ---
  p.application_requirements = p.application_requirements || {};
  p.application_requirements.research_date = STAMP;
  if (r.sources && r.sources[0]) p.application_requirements.research_source = r.sources[0];
  if (r.us_news_note) p.application_requirements.ranking_note = r.us_news_note;

  p.last_updated = STAMP;
  p.data_completeness = (r.confidence === 'low') ? 'partial' : 'complete';

  return { ruleOut };
}

function main() {
  const data = JSON.parse(fs.readFileSync(PROGRAMS, 'utf8'));
  const refresh = JSON.parse(fs.readFileSync(REFRESH, 'utf8'));
  const byId = new Map(data.programs.map(p => [p.id, p]));

  let patched = 0, missing = [], ruled = [];
  const tuitionDeltas = [];
  for (const r of refresh) {
    const p = byId.get(r.id);
    if (!p) { missing.push(r.id); continue; }
    const before = num(p.costs && p.costs.Tuition);
    const { ruleOut } = applyOne(p, r);
    patched++;
    if (ruleOut) ruled.push(r.id);
    const after = num(p.costs.Tuition);
    if (before !== after) tuitionDeltas.push({ id: r.id, before, after, d: after - before });
  }

  fs.writeFileSync(PROGRAMS, JSON.stringify(data, null, 2));

  console.log('=== APPLY REFRESH ' + STAMP + ' ===');
  console.log('patched:', patched, '/', refresh.length);
  console.log('missing ids:', missing.length ? missing : 'none');
  console.log('ruled out (discontinued):', ruled);
  const acc = { yes: 0, no: 0, unknown: 0 };
  for (const r of refresh) acc[r.accepting_spring_2027 === true ? 'yes' : r.accepting_spring_2027 === false ? 'no' : 'unknown']++;
  console.log('spring-2027 cohort -> accepting:', acc.yes, '| none:', acc.no, '| unknown:', acc.unknown);
  tuitionDeltas.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
  console.log('biggest tuition revisions:');
  tuitionDeltas.slice(0, 12).forEach(t => console.log('  ' + t.id.padEnd(24) + (t.before + '').padStart(7) + ' -> ' + (t.after + '').padStart(7) + '  (' + (t.d > 0 ? '+' : '') + t.d + ')'));
  console.log('Saved programs.json');
}

if (process.argv.includes('--check')) {
  // Self-check: emory baseline (Tuition 58000, Fees 3500, Schlrshp 2250, COL 108, dur 12)
  // must reproduce the known display fields Net 59250 / Total Living 19440 / Burn 6558 / Cost Score 0.34.
  const c = { Tuition: 58000, Fees: 3500, 'Schlrshp Amt': 2250, 'COL Index': 108 };
  recomputeCosts(c, 12);
  const ok = c['Net Tuition'] === 59250 && c['Total Living'] === 19440 && c['Mo. Burn'] === 6558 && c['Cost Score'] === 0.34;
  console.log('self-check', ok ? 'PASS' : 'FAIL', JSON.stringify(c));
  if (!ok) process.exit(1);
} else {
  main();
}
