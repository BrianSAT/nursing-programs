let programs = [];
let programsMap = {};
let currentSort = { column: 'raw_score', direction: 'desc' };
let workCommitmentEnabled = {}; // Track per-program: { programId: true/false }
let computedPlanFit = {}; // Computed plan-fit results from engine
let prereqMap = null; // Loaded prereq-map.json

async function loadPrograms() {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');

  try {
    // Load programs, courses, and prereq-map in parallel
    const [programsRes, courseData, prereqMapRes] = await Promise.all([
      fetch('/api/programs').then(r => { if (!r.ok) throw new Error('Failed to load programs'); return r.json(); }),
      CoursesPanel.loadCourseData(),
      fetch('/api/prereq-map').then(r => { if (!r.ok) throw new Error('Failed to load prereq-map'); return r.json(); })
    ]);

    programs = programsRes.programs;
    programsMap = {};
    programs.forEach(p => programsMap[p.id] = p);
    prereqMap = prereqMapRes;

    // Run plan-fit engine
    computedPlanFit = PlanFitEngine.evaluateAll(programs, courseData, prereqMap);

    loading.classList.add('hidden');
    renderTable();

    // Load todo data
    TodoPanel.loadTodoData();

    // Render courses panel if open
    CoursesPanel.renderPanel();
  } catch (e) {
    loading.classList.add('hidden');
    error.textContent = 'Error loading programs: ' + e.message;
    error.classList.remove('hidden');
  }
}

// Called by courses.js when courses change
function reEvaluateAndRender() {
  const courseData = CoursesPanel.getCourseData();
  if (courseData && prereqMap && programs.length > 0) {
    computedPlanFit = PlanFitEngine.evaluateAll(programs, courseData, prereqMap);
    renderTable();
  }
}

function getPlanFit(program) {
  // Use computed plan-fit if available, fall back to stored
  return computedPlanFit[program.id] || program.plan_fit || {};
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

function getPlanFitLabel(status) {
  switch (status) {
    case 'fits': return 'Fits Plan';
    case 'fall_required': return 'Fall Classes';
    case 'adjust': return 'Adjust';
    case 'ruled_out': return 'Ruled Out';
    default: return '-';
  }
}

function getPlanFitBadgeClass(status) {
  switch (status) {
    case 'fits': return 'fits';
    case 'fall_required': return 'fall-required';
    case 'adjust': return 'adjust';
    case 'ruled_out': return 'ruled-out';
    default: return '';
  }
}

function renderTable() {
  const tbody = document.getElementById('programs-body');
  const stats = document.getElementById('stats');
  const search = document.getElementById('search').value.toLowerCase();
  const typeFilter = document.getElementById('type-filter').value;
  const dataFilter = document.getElementById('data-filter').value;
  // Gather checked plan-fit categories
  const fitChecked = new Set();
  document.querySelectorAll('.fit-checkboxes input[type="checkbox"]').forEach(cb => {
    if (cb.checked) fitChecked.add(cb.value);
  });

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
        // Sort by combined location score (location_score x np_pathway), not alphabetically
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
      case 'plan_fit':
        // Sort order: fits (best) > fall_required > adjust > ruled_out (worst)
        const fitOrder = { fits: 1, fall_required: 2, adjust: 3, ruled_out: 4, '': 5 };
        valA = fitOrder[getPlanFit(a).status || ''] || 5;
        valB = fitOrder[getPlanFit(b).status || ''] || 5;
        break;
      case 'raw_score':
      default:
        valA = a.scores?.raw_score ?? -1;
        valB = b.scores?.raw_score ?? -1;
        break;
    }
    // Numeric comparison
    return currentSort.direction === 'asc' ? valA - valB : valB - valA;
  });

  // Stable partition: checked fit categories first, unchecked after
  const prioritized = filtered.filter(p => fitChecked.has(getPlanFit(p).status || ''));
  const deprioritized = filtered.filter(p => !fitChecked.has(getPlanFit(p).status || ''));
  filtered = prioritized.concat(deprioritized);

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

    const planFit = getPlanFit(p);
    const planFitStatus = planFit.status || '';
    const planFitLabel = getPlanFitLabel(planFitStatus);
    const planFitClass = getPlanFitBadgeClass(planFitStatus);

    // NP pathway badge
    const npPathwayType = p.program_details?.np_pathway_type || 'standard';
    let npBadge = '';
    if (npPathwayType === 'pre_specialty') {
      npBadge = '<span class="np-badge pre-specialty" title="Direct NP specialization track">→NP</span>';
    } else if (npPathwayType === 'cnl') {
      npBadge = '<span class="np-badge cnl" title="Clinical Nurse Leader track">CNL</span>';
    }

    const durationDisplay = p.program_details?.duration_months
      ? p.program_details.duration_months + ' mo' + npBadge
      : '-';

    // Verification indicator
    const verifConf = p.verification?.confidence;
    let verifIcon = '';
    if (verifConf === 'verified') {
      verifIcon = '<span class="verif-icon verified" title="Data verified">&#10003;</span>';
    } else if (verifConf === 'needs_verification') {
      verifIcon = '<span class="verif-icon needs-verif" title="Needs verification">!</span>';
    } else {
      verifIcon = '<span class="verif-icon unverified" title="Unverified">?</span>';
    }

    return `
      <tr class="${status === 'needs-data' ? 'needs-data-row' : ''}" onclick="showDetail('${p.id}')">
        <td>${rank != null ? '#' + rank : '-'}</td>
        <td>${verifIcon}<strong>${p.name}</strong></td>
        <td><span class="type-badge type-${p.type}">${p.type}</span></td>
        <td>${p.location?.full || '-'}</td>
        <td>${durationDisplay}</td>
        <td>${formatDate(p.admissions?.start_date)}</td>
        <td>${formatDate(p.admissions?.deadline)}</td>
        <td id="burn-${p.id}">${formatCurrency(monthlyBurn)}</td>
        <td class="work-commit-cell">${workCommitCell}</td>
        <td class="score" id="score-${p.id}">${rawScore != null ? rawScore.toFixed(2) : '-'}</td>
        <td>${planFitStatus ? '<span class="plan-fit-badge ' + planFitClass + '">' + planFitLabel + '</span>' : '-'}</td>
        <td class="status-${status}">${status === 'complete' ? 'Complete' : 'Needs Data'}</td>
      </tr>
    `;
  }).join('');
}

// Event listeners
document.getElementById('search').addEventListener('input', renderTable);
document.getElementById('type-filter').addEventListener('change', renderTable);
document.getElementById('data-filter').addEventListener('change', renderTable);
document.querySelectorAll('.fit-checkboxes input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', renderTable);
});

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
// Uses ratio scaling: since cost_score is a multiplicative factor in the formula,
// we can adjust the stored raw_score by (newCostScore / storedCostScore) rather than
// recomputing everything (which won't match scores imported from Excel).
function recalculateRawScore(program, newCostScore) {
  const storedRawScore = program.scores?.raw_score;
  const storedCostScore = program.scores?.cost_score;

  if (storedRawScore == null || !storedCostScore) return storedRawScore;

  return Math.round((storedRawScore / storedCostScore * newCostScore) * 100) / 100;
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

    // Plan Fit Status — uses computed plan fit
    const planFit = getPlanFit(p);
    if (planFit.status) {
      const fitStatus = planFit.status;
      const fitReasons = planFit.reasons || [];
      let fitTitle = 'Plan Status Unknown';
      let fitBoxClass = '';

      if (fitStatus === 'fits') {
        fitTitle = 'Fits Your Plan';
        fitBoxClass = 'fits';
      } else if (fitStatus === 'fall_required') {
        fitTitle = 'Fall 2026 Classes Required';
        fitBoxClass = 'fall-required';
      } else if (fitStatus === 'adjust') {
        fitTitle = 'Requires Adjustment';
        fitBoxClass = 'adjust';
      } else if (fitStatus === 'ruled_out') {
        fitTitle = 'Ruled Out for Spring 2027';
        fitBoxClass = 'ruled-out';
      }

      html += '<div class="plan-fit-box ' + fitBoxClass + '">';
      html += '<h4><span class="plan-fit-badge ' + fitBoxClass + '">' + getPlanFitLabel(fitStatus) + '</span> ' + fitTitle + '</h4>';
      if (fitReasons.length > 0) {
        html += '<ul>';
        fitReasons.forEach(function(reason) {
          html += '<li>' + escapeHtml(reason) + '</li>';
        });
        html += '</ul>';
      }
      // Show warnings if any
      const fitWarnings = planFit.warnings || [];
      if (fitWarnings.length > 0) {
        html += '<div class="plan-fit-warnings">';
        fitWarnings.forEach(function(warning) {
          html += '<div class="plan-fit-warning">' + escapeHtml(warning) + '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    }

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

    // Transferology note
    if (p.admissions?.uses_transferology) {
      html += '<div class="transferology-note">Uses <a href="https://www.transferology.com" target="_blank" class="contact-link">Transferology</a> to validate prerequisite course equivalencies</div>';
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
      const modalWcName = wc.program_name || wc.name || 'Work-Commitment Scholarship';
      const modalWcYears = wc.commitment_years || wc.years || '?';
      const modalWcEmployer = wc.employer ? ' at ' + escapeHtml(wc.employer) : '';
      html += '<div class="work-commit-card" style="margin-top: 15px;">';
      html += '<h3 style="margin: 0 0 8px 0;">Work-Commitment Option Available</h3>';
      html += '<div class="amount">' + formatCurrency(wc.amount) + '</div>';
      html += '<div class="details"><strong>' + escapeHtml(modalWcName) + '</strong><br>';
      html += modalWcYears + '-year commitment' + modalWcEmployer + '</div>';
      if (wc.notes) html += '<div class="notes">' + escapeHtml(wc.notes) + '</div>';
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

    // Verification Status
    const verif = p.verification || {};
    html += '<div class="detail-section"><h3>Data Verification</h3>';

    let verifBadgeClass = 'unverified';
    let verifBadgeText = 'Unverified';
    if (verif.confidence === 'verified') {
      verifBadgeClass = 'verified';
      verifBadgeText = '&#10003; Verified';
    } else if (verif.confidence === 'needs_verification') {
      verifBadgeClass = 'needs-verification';
      verifBadgeText = '&#9888; Needs Verification';
    }

    html += '<span class="verification-badge ' + verifBadgeClass + '">' + verifBadgeText + '</span>';

    if (verif.last_verified) {
      html += ' <span style="color: #666; font-size: 0.8rem;">Last verified: ' + verif.last_verified + '</span>';
    }

    if (verif.notes) {
      html += '<div class="verification-note">' + escapeHtml(verif.notes) + '</div>';
    }

    if (verif.sources?.primary) {
      html += '<div class="verification-note"><a href="' + escapeHtml(verif.sources.primary) + '" target="_blank">View source &rarr;</a></div>';
    }

    html += '</div>';

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

  const wcName = wc.program_name || wc.name || 'Work-Commitment Scholarship';
  const wcYears = wc.commitment_years || wc.years || '?';
  const wcEmployer = wc.employer ? ' at ' + escapeHtml(wc.employer) : '';
  const wcNotes = wc.notes ? `<div class="notes">${escapeHtml(wc.notes)}</div>` : '';

  container.innerHTML = `
    <div class="work-commit-card">
      <h3>${escapeHtml(program.name)}</h3>
      <div class="amount">${formatCurrency(wc.amount)} scholarship</div>
      <div class="details">
        <strong>${escapeHtml(wcName)}</strong><br>
        ${wcYears}-year commitment${wcEmployer}
      </div>
      ${wcNotes}
      <div class="calculation">
        <strong>Impact:</strong><br>
        Monthly burn: ${formatCurrency(baseBurn)} &rarr; ${formatCurrency(newBurn)} (-${formatCurrency(monthlyBenefit)}/mo)<br>
        Score: ${oldRawScore.toFixed(2)} &rarr; ${newRawScore.toFixed(2)} (${scoreDiff >= 0 ? '+' : ''}${scoreDiff.toFixed(2)})
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

// ===== PANEL MANAGEMENT =====

let panelOpen = false;
let activeTab = null; // 'courses' or 'todos'

function togglePanel(tab) {
  const panel = document.getElementById('side-panel');
  const mainContent = document.querySelector('main');
  const btnCourses = document.getElementById('btn-courses');
  const btnTodos = document.getElementById('btn-todos');
  const coursesContent = document.getElementById('courses-panel-content');
  const todosContent = document.getElementById('todos-panel-content');

  // If clicking the same tab that's open, close the panel
  if (panelOpen && activeTab === tab) {
    panelOpen = false;
    activeTab = null;
    panel.classList.remove('open');
    mainContent.classList.remove('panel-open');
    btnCourses.classList.remove('active');
    btnTodos.classList.remove('active');
    return;
  }

  // Open or switch tab
  panelOpen = true;
  activeTab = tab;
  panel.classList.add('open');
  mainContent.classList.add('panel-open');

  // Update button states
  btnCourses.classList.toggle('active', tab === 'courses');
  btnTodos.classList.toggle('active', tab === 'todos');

  // Show correct content
  if (tab === 'courses') {
    coursesContent.classList.remove('hidden');
    todosContent.classList.add('hidden');
    CoursesPanel.renderPanel();
  } else {
    coursesContent.classList.add('hidden');
    todosContent.classList.remove('hidden');
    TodoPanel.renderPanel();
  }
}

loadPrograms();
