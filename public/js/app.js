let programs = [];

async function loadPrograms() {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');

  try {
    const response = await fetch('/api/programs');
    if (!response.ok) throw new Error('Failed to load programs');

    const data = await response.json();
    programs = data.programs;
    loading.classList.add('hidden');
    renderTable();
  } catch (e) {
    loading.classList.add('hidden');
    error.textContent = 'Error loading programs: ' + e.message;
    error.classList.remove('hidden');
  }
}

function renderTable() {
  const tbody = document.getElementById('programs-body');
  const search = document.getElementById('search').value.toLowerCase();
  const sortBy = document.getElementById('sort-by').value;

  let filtered = programs.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.location?.city?.toLowerCase().includes(search) ||
    p.location?.state?.toLowerCase().includes(search)
  );

  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'monthly_burn':
        return (a.calculated?.monthly_burn || 0) - (b.calculated?.monthly_burn || 0);
      case 'duration':
        return (a.program_details?.duration_months || 0) - (b.program_details?.duration_months || 0);
      case 'raw_score':
      default:
        return (b.calculated?.raw_score || 0) - (a.calculated?.raw_score || 0);
    }
  });

  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td>${p.location?.city || ''}, ${p.location?.state || ''}</td>
      <td>${p.type || ''}</td>
      <td>${p.program_details?.duration_months || '?'} mo</td>
      <td>$${(p.calculated?.monthly_burn || 0).toLocaleString()}/mo</td>
      <td class="score">${p.calculated?.raw_score || '?'}</td>
      <td class="status-${p.data_completeness || 'stub'}">${p.data_completeness || 'stub'}</td>
    </tr>
  `).join('');
}

document.getElementById('search').addEventListener('input', renderTable);
document.getElementById('sort-by').addEventListener('change', renderTable);

loadPrograms();
