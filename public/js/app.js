let programs = [];
let programsMap = {};

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
  const sortBy = document.getElementById('sort-by').value;

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

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rank':
        const rankA = a.scores?.rank ?? 999;
        const rankB = b.scores?.rank ?? 999;
        return rankA - rankB;
      case 'duration':
        const durA = a.program_details?.duration_months ?? 999;
        const durB = b.program_details?.duration_months ?? 999;
        return durA - durB;
      case 'monthly_burn':
        const burnA = a.costs?.['Mo. Burn'] ?? 999999;
        const burnB = b.costs?.['Mo. Burn'] ?? 999999;
        return burnA - burnB;
      case 'start_date':
        const startA = a.admissions?.start_date || '9999-99-99';
        const startB = b.admissions?.start_date || '9999-99-99';
        return startA.localeCompare(startB);
      case 'deadline':
        const deadA = a.admissions?.deadline || '9999-99-99';
        const deadB = b.admissions?.deadline || '9999-99-99';
        return deadA.localeCompare(deadB);
      case 'raw_score':
      default:
        const scoreA = a.scores?.raw_score ?? -1;
        const scoreB = b.scores?.raw_score ?? -1;
        return scoreB - scoreA; // Descending
    }
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
document.getElementById('sort-by').addEventListener('change', renderTable);

// Modal functions
function showDetail(id) {
  const p = programsMap[id];
  if (!p) return;

  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');

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

  const prereqHtml = Object.entries(prereqLabels).map(([key, label]) => {
    const required = prereqs[key];
    return `<span class="prereq-tag ${required ? 'required' : 'not-required'}">${label}</span>`;
  }).join('');

  const scores = p.scores || {};
  const costs = p.costs || {};

  body.innerHTML = `
    <div class="detail-header">
      <h2>${p.name}</h2>
      <div class="meta">
        <span class="type-badge type-${p.type}">${p.type}</span>
        &nbsp;•&nbsp; ${p.location?.full || 'Location unknown'}
        ${scores.rank ? `&nbsp;•&nbsp; Rank #${scores.rank}` : ''}
      </div>
    </div>

    ${p.notes ? `
    <div class="detail-section">
      <h3>Notes</h3>
      <div class="notes-box">${p.notes}</div>
    </div>
    ` : ''}

    <div class="detail-section">
      <h3>Program Details</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="label">Duration</div>
          <div class="value">${p.program_details?.duration_months ? p.program_details.duration_months + ' months' : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="label">Terms</div>
          <div class="value">${p.program_details?.terms || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="label">Start Date</div>
          <div class="value">${formatDate(p.admissions?.start_date)}</div>
        </div>
        <div class="detail-item">
          <div class="label">Deadline</div>
          <div class="value">${formatDate(p.admissions?.deadline)}</div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>Scores</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="label">Raw Score</div>
          <div class="value" style="color: #2563eb; font-size: 1.2rem;">${scores.raw_score?.toFixed(2) || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="label">Location</div>
          <div class="value">${scores.location_score || '-'}${scores.location_boost ? ` (+${scores.location_boost})` : ''}</div>
        </div>
        <div class="detail-item">
          <div class="label">Prestige</div>
          <div class="value">${scores.prestige ? (scores.prestige * 100).toFixed(0) + '%' : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="label">NP Pathway</div>
          <div class="value">${scores.np_pathway ? (scores.np_pathway * 100).toFixed(0) + '%' : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="label">Competitiveness</div>
          <div class="value">${scores.competitiveness ? (scores.competitiveness * 100).toFixed(0) + '%' : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="label">Start Score</div>
          <div class="value">${scores.start_score ? (scores.start_score * 100).toFixed(0) + '%' : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="label">Cost Score</div>
          <div class="value">${scores.cost_score ? (scores.cost_score * 100).toFixed(0) + '%' : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="label">Nat'l Percentile</div>
          <div class="value">${scores.national_percentile ? (scores.national_percentile * 100).toFixed(0) + '%' : '-'}</div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>Costs</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="label">Tuition</div>
          <div class="value">${formatCurrency(costs.Tuition)}</div>
        </div>
        <div class="detail-item">
          <div class="label">Fees</div>
          <div class="value">${formatCurrency(costs.Fees)}</div>
        </div>
        <div class="detail-item">
          <div class="label">Net Tuition</div>
          <div class="value">${formatCurrency(costs['Net Tuition'])}</div>
        </div>
        <div class="detail-item">
          <div class="label">Monthly Burn</div>
          <div class="value" style="color: #dc2626;">${formatCurrency(costs['Mo. Burn'])}</div>
        </div>
        <div class="detail-item">
          <div class="label">Total Cost</div>
          <div class="value">${formatCurrency(costs['Total Cost'])}</div>
        </div>
        <div class="detail-item">
          <div class="label">Scholarship</div>
          <div class="value">${costs['Schlrshp Amt'] ? formatCurrency(costs['Schlrshp Amt']) + ' (' + (costs['Schlrshp %'] * 100) + '%)' : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="label">COL Index</div>
          <div class="value">${costs['COL Index'] || '-'}</div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>Prerequisites</h3>
      <div class="prereq-grid">
        ${prereqHtml}
      </div>
      ${p.prerequisites?.additional ? `<div style="margin-top: 10px; font-size: 0.9rem; color: #666;"><strong>Additional:</strong> ${p.prerequisites.additional}</div>` : ''}
    </div>

    ${p.admissions?.email ? `
    <div class="detail-section">
      <h3>Contact</h3>
      <a href="mailto:${p.admissions.email}" class="contact-link">${p.admissions.email}</a>
    </div>
    ` : ''}
  `;

  modal.classList.remove('hidden');
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
