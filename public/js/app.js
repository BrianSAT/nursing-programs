let programs = [];
let programsMap = {};
let currentSort = { column: 'raw_score', direction: 'desc' };

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
    const monthlyBurn = p.costs?.['Mo. Burn'];
    const rawScore = p.scores?.raw_score;
    const rank = p.scores?.rank;

    return `
      <tr class="${status === 'needs-data' ? 'needs-data-row' : ''}" onclick="showDetail('${p.id}')">
        <td>${rank != null ? '#' + rank : '-'}</td>
        <td><strong>${p.name}</strong></td>
        <td><span class="type-badge type-${p.type}">${p.type}</span></td>
        <td>${p.location?.full || '-'}</td>
        <td>${p.program_details?.duration_months ? p.program_details.duration_months + ' mo' : '-'}</td>
        <td>${formatDate(p.admissions?.start_date)}</td>
        <td>${formatDate(p.admissions?.deadline)}</td>
        <td>${formatCurrency(monthlyBurn)}</td>
        <td class="score">${rawScore != null ? rawScore.toFixed(2) : '-'}</td>
        <td class="status-${status}">${status === 'complete' ? 'Complete' : 'Needs Data'}</td>
      </tr>
    `;
  }).join('');
}

// Event listeners
document.getElementById('search').addEventListener('input', renderTable);
document.getElementById('type-filter').addEventListener('change', renderTable);
document.getElementById('data-filter').addEventListener('change', renderTable);

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
    html += '</div></div>';

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
    html += '<div class="detail-item"><div class="label">Monthly Burn</div><div class="value" style="color: #dc2626;">' + formatCurrency(costs['Mo. Burn']) + '</div></div>';
    html += buildDetailItem('Total Cost', formatCurrency(costs['Total Cost']));
    const scholarshipText = costs['Schlrshp Amt'] ? formatCurrency(costs['Schlrshp Amt']) + ' (' + (costs['Schlrshp %'] * 100) + '%)' : '-';
    html += buildDetailItem('Scholarship', scholarshipText);
    html += buildDetailItem('COL Index', costs['COL Index'] || '-');
    html += '</div></div>';

    // Prerequisites
    html += '<div class="detail-section"><h3>Prerequisites</h3>';
    html += '<div class="prereq-grid">' + prereqHtml + '</div>';
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
  if (e.key === 'Escape') closeModal();
});

loadPrograms();
