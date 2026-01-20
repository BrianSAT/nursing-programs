let programs = [];
let programsMap = {};
let currentSort = { column: 'raw_score', direction: 'desc' };
let workCommitmentEnabled = {}; // Track per-program: { programId: true/false }

async function loadPrograms() {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');

  try {
    const response = await fetch('/api/programs');
    if (!response.ok) throw new Error('Failed to load programs');

    const data = await response.json();
    programs = data.programs;
    programsMap = {};
    programs.forEach(p => programsMap[p.id] = p);
    loading.classList.add('hidden');
    renderTable();
  } catch (e) {
    loading.classList.add('hidden');
    error.textContent = 'Error loading programs: ' + e.message;
    error.classList.remove('hidden');
  }
}

function getDataStatus(program) {
  return program.scores?.raw_score != null ? 'complete' : 'needs-data';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function formatCurrency(amount) {
  if (amount == null) return '-';
  return '$' + Math.round(amount).toLocaleString();
}

function getDisplayedMonthlyBurn(program) {
  if (!program.costs) return null;

  const baseBurn = program.costs['Mo. Burn'];
  if (baseBurn == null) return null;

  if (workCommitmentEnabled[program.id] && program.scholarships?.work_commitment) {
    // Calculate adjusted burn with work-commitment scholarship
    const wc = program.scholarships.work_commitment;
    const duration = program.costs['Duration (mo)'] || program.program_details?.duration_months || 12;
    // Apply 50% probability for competitive scholarships
    const expectedValue = wc.competitive ? wc.amount * 0.5 : wc.amount;
    const monthlyBenefit = expectedValue / duration;
    return Math.max(0, baseBurn - monthlyBenefit);
  }

  return baseBurn;
}

function renderTable() {
  const tbody = document.getElementById('programs-body');
  const stats = document.getElementById('stats');
  const search = document.getElementById('search').value.toLowerCase();
  const typeFilter = document.getElementById('type-filter').value;
  const dataFilter = document.getElementById('data-filter').value;

  let filtered = programs.filter(p => {
    // Search filter
    const searchMatch = !search ||
      p.name.toLowerCase().includes(search) ||
      (p.location?.full || '').toLowerCase().includes(search);

    // Type filter
    const typeMatch = !typeFilter || p.type === typeFilter;

    // Data status filter
    const status = getDataStatus(p);
    const dataMatch = !dataFilter ||
      (dataFilter === 'complete' && status === 'complete') ||
      (dataFilter === 'needs-data' && status === 'needs-data');

    return searchMatch && typeMatch && dataMatch;
  });

  // Sort based on currentSort
  filtered.sort((a, b) => {
    let valA, valB;
    const col = currentSort.column;

    switch (col) {
      case 'name':
        valA = a.name || '';
        valB = b.name || '';
        return currentSort.direction === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      case 'type':
        valA = a.type || '';
        valB = b.type || '';
        return currentSort.direction === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      case 'location':
        // Sort by combined location score (location_score × np_pathway), not alphabetically
        valA = a.scores?.location_combined ?? 0;
        valB = b.scores?.location_combined ?? 0;
        break;
      case 'status':
        valA = getDataStatus(a);
        valB = getDataStatus(b);
        return currentSort.direction === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      case 'rank':
        valA = a.scores?.rank ?? 999;
        valB = b.scores?.rank ?? 999;
        break;
      case 'duration':
        valA = a.program_details?.duration_months ?? 999;
        valB = b.program_details?.duration_months ?? 999;
        break;
      case 'monthly_burn':
        valA = a.costs?.['Mo. Burn'] ?? 999999;
        valB = b.costs?.['Mo. Burn'] ?? 999999;
        break;
      case 'start_date':
        valA = a.admissions?.start_date || '9999-99-99';
        valB = b.admissions?.start_date || '9999-99-99';
        return currentSort.direction === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      case 'deadline':
        valA = a.admissions?.deadline || '9999-99-99';
        valB = b.admissions?.deadline || '9999-99-99';
        return currentSort.direction === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      case 'raw_score':
      default:
        valA = a.scores?.raw_score ?? -1;
        valB = b.scores?.raw_score ?? -1;
        break;
    }
    // Numeric comparison
    return currentSort.direction === 'asc' ? valA - valB : valB - valA;
  });

  // Update stats
  const complete = filtered.filter(p => getDataStatus(p) === 'complete').length;
  const needsData = filtered.length - complete;
  stats.textContent = `Showing ${filtered.length} programs (${complete} complete, ${needsData} needs data)`;

  // Render rows
  tbody.innerHTML = filtered.map(p => {
    const status = getDataStatus(p);
    const monthlyBurn = getDisplayedMonthlyBurn(p);
    const rawScore = p.scores?.raw_score;
    const rank = p.scores?.rank;
    const hasWorkCommit = p.scholarships?.work_commitment != null;
    const isChecked = workCommitmentEnabled[p.id] ? 'checked' : '';
    const workCommitCell = hasWorkCommit
      ? `<input type="checkbox" class="work-commit-checkbox" data-program-id="${p.id}" ${isChecked} onclick="event.stopPropagation(); toggleWorkCommit('${p.id}', this)">`
      : '-';

    return `
      <tr class="${status === 'needs-data' ? 'needs-data-row' : ''}" onclick="showDetail('${p.id}')">
        <td>${rank != null ? '#' + rank : '-'}</td>
        <td><strong>${p.name}</strong></td>
        <td><span class="type-badge type-${p.type}">${p.type}</span></td>
        <td>${p.location?.full || '-'}</td>
        <td>${p.program_details?.duration_months ? p.program_details.duration_months + ' mo' : '-'}</td>
        <td>${formatDate(p.admissions?.start_date)}</td>
        <td>${formatDate(p.admissions?.deadline)}</td>
        <td id="burn-${p.id}">${formatCurrency(monthlyBurn)}</td>
        <td class="work-commit-cell">${workCommitCell}</td>
        <td class="score" id="score-${p.id}">${rawScore != null ? rawScore.toFixed(2) : '-'}</td>
        <td class="status-${status}">${status === 'complete' ? 'Complete' : 'Needs Data'}</td>
      </tr>
    `;
  }).join('');
}

// Event listeners
document.getElementById('search').addEventListener('input', renderTable);
document.getElementById('type-filter').addEventListener('change', renderTable);
document.getElementById('data-filter').addEventListener('change', renderTable);

// Work-commitment checkbox toggle (per-program)
function toggleWorkCommit(programId, checkbox) {
  const program = programsMap[programId];
  if (!program || !program.scholarships?.work_commitment) return;

  if (checkbox.checked) {
    // Show popup with work-commitment details
    workCommitmentEnabled[programId] = true;
    showWorkCommitPopup(program);
  } else {
    workCommitmentEnabled[programId] = false;
  }

  // Recalculate cost score and raw score
  const newBurn = getDisplayedMonthlyBurn(program);
  const newCostScore = Math.max(0, 1 - (newBurn / 10000));
  const newRawScore = recalculateRawScore(program, newCostScore);

  // Update the monthly burn display for this row
  const burnCell = document.getElementById('burn-' + programId);
  if (burnCell) {
    burnCell.textContent = formatCurrency(newBurn);
  }

  // Update the score display for this row
  const scoreCell = document.getElementById('score-' + programId);
  if (scoreCell) {
    scoreCell.textContent = newRawScore != null ? newRawScore.toFixed(2) : '-';
  }
}

// Recalculate raw score with new cost score
function recalculateRawScore(program, costScore) {
  const scores = program.scores || {};
  const details = program.program_details || {};
  const costs = program.costs || {};

  const base = (scores.location_score || 5) + (scores.location_boost || 0);
  const prereqFit = program.prerequisites?.addl_prereq_fit || 1.0;
  const onlineLabConf = scores.online_lab_conf || details.online_lab_conf || 1.0;
  const npPathway = scores.np_pathway || 0.5;
  const prestige = scores.prestige || 1.0;
  const competitiveness = scores.competitiveness || 1.0;
  const startScore = scores.start_score || 1.0;

  // Time factor
  const duration = costs['Duration (mo)'] || details.duration_months || 12;
  let timeFactor = 1.0;
  if (duration >= 32) timeFactor = 0.2;       // 80% penalty
  else if (duration >= 24) timeFactor = 0.4;  // 60% penalty
  else if (duration >= 17) timeFactor = 0.6;  // 40% penalty
  else if (duration >= 13) timeFactor = 0.8;  // 20% penalty

  const rawScore = base * prereqFit * onlineLabConf * npPathway * prestige * competitiveness * startScore * timeFactor * costScore;
  return Math.round(rawScore * 100) / 100;
}

// Column header sorting
function setupSortableHeaders() {
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.sort;

      // Toggle direction if same column, otherwise default direction
      if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = column;
        // Default directions: score/rank desc, others asc
        currentSort.direction = ['raw_score', 'rank'].includes(column) ? 'desc' : 'asc';
      }

      // Update header classes
      document.querySelectorAll('th.sortable').forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
      });
      th.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');

      renderTable();
    });
  });
}

document.addEventListener('DOMContentLoaded', setupSortableHeaders);

// Modal functions
function showDetail(id) {
  const p = programsMap[id];
  if (!p) {
    console.error('Program not found:', id);
    return;
  }

  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');

  try {
    const prereqs = p.prerequisites?.standard || {};
    const prereqLabels = {
      ap_1_2: 'A&P 1+2',
      micro: 'Microbiology',
      stats: 'Statistics',
      chem: 'Chemistry',
      lifespan: 'Lifespan Psych',
      nutrition: 'Nutrition',
      psych: 'Gen Psychology',
      sociology: 'Sociology',
      biology: 'Biology',
      ethics: 'Ethics'
    };

    const prereqHtml = Object.entries(prereqLabels).map(function(entry) {
      const key = entry[0];
      const label = entry[1];
      const required = prereqs[key];
      return '<span class="prereq-tag ' + (required ? 'required' : 'not-required') + '">' + label + '</span>';
    }).join('');

    const scores = p.scores || {};
    const costs = p.costs || {};

    // Helper to safely format numbers
    function safePercent(val) {
      if (val == null) return '-';
      return (val * 100).toFixed(0) + '%';
    }

    function safeScore(val) {
      if (val == null) return '-';
      return val.toFixed(2);
    }

    // Build HTML in parts
    let html = '';

    // Header
    html += '<div class="detail-header">';
    html += '<h2>' + escapeHtml(p.name) + '</h2>';
    html += '<div class="meta">';
    html += '<span class="type-badge type-' + p.type + '">' + p.type + '</span>';
    html += ' &bull; ' + escapeHtml(p.location?.full || 'Location unknown');
    if (scores.rank) html += ' &bull; Rank #' + scores.rank;
    html += '</div></div>';

    // Notes
    if (p.notes) {
      html += '<div class="detail-section">';
      html += '<h3>Notes</h3>';
      html += '<div class="notes-box">' + escapeHtml(p.notes) + '</div>';
      html += '</div>';
    }

    // Program Details
    html += '<div class="detail-section"><h3>Program Details</h3><div class="detail-grid">';
    html += buildDetailItem('Duration', p.program_details?.duration_months ? p.program_details.duration_months + ' months' : '-');
    html += buildDetailItem('Terms', p.program_details?.terms || '-');
    html += buildDetailItem('Start Date', formatDate(p.admissions?.start_date));
    html += buildDetailItem('Deadline', formatDate(p.admissions?.deadline));

    // Application timing - can apply while courses in progress?
    let appTimingHtml = '';
    const inProgressOk = p.admissions?.in_progress_ok;
    if (inProgressOk === true) {
      appTimingHtml = '<span class="app-timing-badge in-progress-ok">Can apply while enrolled</span>';
    } else if (inProgressOk === false) {
      appTimingHtml = '<span class="app-timing-badge completed-only">Prereqs must be complete</span>';
    } else {
      appTimingHtml = '<span class="app-timing-badge unknown">Check with school</span>';
    }
    html += '<div class="detail-item"><div class="label">Apply While Enrolled?</div><div class="value">' + appTimingHtml + '</div></div>';

    // NP Pathway type
    const npPathwayType = p.program_details?.np_pathway_type || 'standard';
    let npPathwayLabel = 'Standard';
    let npPathwayStyle = '';
    if (npPathwayType === 'pre_specialty') {
      npPathwayLabel = 'Pre-Specialty';
      npPathwayStyle = 'color: #16a34a;';
    } else if (npPathwayType === 'cnl') {
      npPathwayLabel = 'CNL Track';
      npPathwayStyle = 'color: #f59e0b;';
    }
    html += '<div class="detail-item"><div class="label">NP Pathway</div><div class="value" style="' + npPathwayStyle + '">' + npPathwayLabel + '</div></div>';
    html += '</div>';

    // NP Pathway notes if present
    if (p.program_details?.np_pathway_notes) {
      html += '<div class="np-pathway-note">' + escapeHtml(p.program_details.np_pathway_notes) + '</div>';
    }
    html += '</div>';

    // Scores
    html += '<div class="detail-section"><h3>Scores</h3><div class="detail-grid">';
    html += '<div class="detail-item"><div class="label">Raw Score</div><div class="value" style="color: #2563eb; font-size: 1.2rem;">' + safeScore(scores.raw_score) + '</div></div>';
    html += buildDetailItem('Location', (scores.location_score || '-') + (scores.location_boost ? ' (+' + scores.location_boost + ')' : ''));
    html += buildDetailItem('Prestige', safePercent(scores.prestige));
    html += buildDetailItem('NP Pathway', safePercent(scores.np_pathway));
    html += buildDetailItem('Competitiveness', safePercent(scores.competitiveness));
    html += buildDetailItem('Start Score', safePercent(scores.start_score));
    html += buildDetailItem('Cost Score', safePercent(scores.cost_score));
    html += buildDetailItem("Nat'l Percentile", safePercent(scores.national_percentile));
    html += '</div></div>';

    // Costs
    html += '<div class="detail-section"><h3>Costs</h3><div class="detail-grid">';
    html += buildDetailItem('Tuition', formatCurrency(costs.Tuition));
    html += buildDetailItem('Fees', formatCurrency(costs.Fees));
    html += buildDetailItem('Net Tuition', formatCurrency(costs['Net Tuition']));
    const displayedBurn = getDisplayedMonthlyBurn(p);
    html += '<div class="detail-item"><div class="label">Monthly Burn' + (workCommitmentEnabled[p.id] && p.scholarships?.work_commitment ? ' (w/ WC)' : '') + '</div><div class="value" style="color: #dc2626;">' + formatCurrency(displayedBurn) + '</div></div>';
    html += buildDetailItem('COL Index', costs['COL Index'] || '-');
    html += '</div></div>';

    // Scholarships
    const scholarships = p.scholarships || {};
    html += '<div class="detail-section"><h3>Scholarships</h3><div class="detail-grid">';

    // Guaranteed
    if (scholarships.guaranteed) {
      html += '<div class="detail-item"><div class="label">Guaranteed</div><div class="value" style="color: #16a34a;">' + formatCurrency(scholarships.guaranteed.amount) + '</div></div>';
    } else {
      html += buildDetailItem('Guaranteed', 'None');
    }

    // Merit
    if (scholarships.merit?.pool > 0) {
      html += buildDetailItem('Merit Pool', formatCurrency(scholarships.merit.pool) + ' (' + (scholarships.merit.probability * 100) + '% chance)');
    } else {
      html += buildDetailItem('Merit', 'None');
    }

    // Expected value
    html += buildDetailItem('Expected Value', formatCurrency(scholarships.expected_value_no_commitment || 0));
    html += '</div>';

    // Work-commitment section
    if (scholarships.work_commitment) {
      const wc = scholarships.work_commitment;
      html += '<div class="work-commit-card" style="margin-top: 15px;">';
      html += '<h3 style="margin: 0 0 8px 0;">Work-Commitment Option Available</h3>';
      html += '<div class="amount">' + formatCurrency(wc.amount) + '</div>';
      html += '<div class="details"><strong>' + escapeHtml(wc.program_name) + '</strong><br>';
      html += wc.commitment_years + '-year commitment at ' + escapeHtml(wc.employer) + '</div>';
      html += '<div class="notes">' + escapeHtml(wc.notes) + '</div>';
      html += '</div>';
    }
    html += '</div>';

    // Prerequisites
    html += '<div class="detail-section"><h3>Prerequisites</h3>';
    html += '<div class="prereq-grid">' + prereqHtml + '</div>';

    // Extra/unconventional prereqs (shown in red)
    if (p.prerequisites?.extra && p.prerequisites.extra.length > 0) {
      html += '<div class="prereq-grid" style="margin-top: 10px;">';
      p.prerequisites.extra.forEach(function(extraReq) {
        html += '<span class="prereq-tag extra">' + escapeHtml(extraReq) + '</span>';
      });
      html += '</div>';
    }

    if (p.prerequisites?.additional) {
      html += '<div style="margin-top: 10px; font-size: 0.9rem; color: #666;"><strong>Additional:</strong> ' + escapeHtml(p.prerequisites.additional) + '</div>';
    }
    html += '</div>';

    // Contact
    if (p.admissions?.email) {
      html += '<div class="detail-section"><h3>Contact</h3>';
      html += '<a href="mailto:' + escapeHtml(p.admissions.email) + '" class="contact-link">' + escapeHtml(p.admissions.email) + '</a>';
      html += '</div>';
    }

    body.innerHTML = html;
    modal.classList.remove('hidden');

  } catch (err) {
    console.error('Error rendering detail:', err);
    body.innerHTML = '<p style="color: red;">Error loading program details. Check console.</p>';
    modal.classList.remove('hidden');
  }
}

function buildDetailItem(label, value) {
  return '<div class="detail-item"><div class="label">' + label + '</div><div class="value">' + value + '</div></div>';
}

function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

// Close modal on background click
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') closeModal();
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeWorkCommitModal();
  }
});

// Work-commitment popup functions (for single program)
function showWorkCommitPopup(program) {
  const modal = document.getElementById('work-commit-modal');
  const container = document.getElementById('work-commit-programs');
  const wc = program.scholarships.work_commitment;

  const duration = program.costs?.['Duration (mo)'] || program.program_details?.duration_months || 12;
  const expectedValue = wc.competitive ? wc.amount * 0.5 : wc.amount;
  const monthlyBenefit = Math.round(expectedValue / duration);

  // Calculate score change
  const baseBurn = program.costs?.['Mo. Burn'] || 0;
  const newBurn = Math.max(0, baseBurn - monthlyBenefit);
  const oldCostScore = Math.max(0, 1 - (baseBurn / 10000));
  const newCostScore = Math.max(0, 1 - (newBurn / 10000));
  const oldRawScore = program.scores?.raw_score || 0;
  const newRawScore = recalculateRawScore(program, newCostScore);
  const scoreDiff = newRawScore - oldRawScore;

  container.innerHTML = `
    <div class="work-commit-card">
      <h3>${escapeHtml(program.name)}</h3>
      <div class="amount">${formatCurrency(wc.amount)} scholarship</div>
      <div class="details">
        <strong>${escapeHtml(wc.program_name)}</strong><br>
        ${wc.commitment_years}-year commitment at ${escapeHtml(wc.employer)}
      </div>
      <div class="notes">${escapeHtml(wc.notes)}</div>
      <div class="calculation">
        <strong>Impact:</strong><br>
        Monthly burn: ${formatCurrency(baseBurn)} → ${formatCurrency(newBurn)} (-${formatCurrency(monthlyBenefit)}/mo)<br>
        Score: ${oldRawScore.toFixed(2)} → ${newRawScore.toFixed(2)} (+${scoreDiff.toFixed(2)})
        ${wc.competitive ? '<br><small>(Using 50% expected value due to competitive selection)</small>' : ''}
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeWorkCommitModal() {
  document.getElementById('work-commit-modal').classList.add('hidden');
}

// Close work-commit modal on background click
document.getElementById('work-commit-modal').addEventListener('click', (e) => {
  if (e.target.id === 'work-commit-modal') closeWorkCommitModal();
});

loadPrograms();
