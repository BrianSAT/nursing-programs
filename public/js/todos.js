/**
 * Todo Side Panel
 *
 * Manages the "To Do" tab: renders task timeline with time buckets,
 * task cards, checkbox toggle, expand/collapse, program filter,
 * add task form, and stats bar.
 */

const TodoPanel = (function () {

  let todoData = null; // { tracked_programs, tasks, settings }
  let filterProgram = ''; // '' = all programs
  let expandedTaskId = null;
  let showingAddForm = false;
  let overdueHidden = false;
  let overduePromptShown = false;

  const CATEGORIES = ['application', 'document', 'exam', 'fee', 'verification', 'course', 'custom'];

  const CATEGORY_LABELS = {
    application: 'application',
    document: 'document',
    exam: 'exam',
    fee: 'fee',
    verification: 'verification',
    course: 'course',
    custom: 'custom'
  };

  const APP_STATUS_LABELS = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    accepted: 'Accepted',
    withdrawn: 'Withdrawn'
  };

  const APP_STATUS_COLORS = {
    not_started: '#94a3b8',
    in_progress: '#f59e0b',
    submitted: '#3b82f6',
    accepted: '#22c55e',
    withdrawn: '#ef4444'
  };

  // Normalize tracked_programs: supports both string[] and object[] formats
  function getTrackedProgramIds() {
    if (!todoData || !todoData.tracked_programs) return [];
    return todoData.tracked_programs.map(p => typeof p === 'string' ? p : p.id);
  }

  function getTrackedProgramObj(programId) {
    if (!todoData || !todoData.tracked_programs) return null;
    for (const p of todoData.tracked_programs) {
      if (typeof p === 'string') {
        if (p === programId) return { id: p, app_status: 'not_started' };
      } else {
        if (p.id === programId) return p;
      }
    }
    return null;
  }

  function getAppStatus(programId) {
    const obj = getTrackedProgramObj(programId);
    return obj ? (obj.app_status || 'not_started') : 'not_started';
  }

  async function loadTodoData() {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to load todos');
      todoData = await response.json();
      // Check for overdue application tasks on first load
      if (!overduePromptShown) {
        overduePromptShown = true;
        checkOverduePrograms();
      }
      return todoData;
    } catch (e) {
      console.error('Error loading todo data:', e);
      todoData = { tracked_programs: [], tasks: [], settings: {} };
      return todoData;
    }
  }

  function checkOverduePrograms() {
    if (!todoData) return;
    // Find application tasks that are overdue (deadline has passed)
    const overdueApps = (todoData.tasks || []).filter(t =>
      t.category === 'application' &&
      t.status === 'pending' &&
      t.due_date &&
      daysDiff(t.due_date) < 0
    );
    if (overdueApps.length === 0) return;

    const programNames = overdueApps.map(t => {
      const pid = (t.applies_to || [])[0];
      return pid ? getProgramName(pid) : t.title;
    });

    const msg = 'The following programs have passed deadlines:\n\n' +
      programNames.map(n => '  - ' + n).join('\n') +
      '\n\nWould you like to delist them (remove from tracked)?';

    if (confirm(msg)) {
      delistOverduePrograms(overdueApps);
    }
  }

  async function delistOverduePrograms(overdueTasks) {
    for (const task of overdueTasks) {
      const programIds = task.applies_to || [];
      // Skip the application task
      await apiUpdateTask(task.id, { status: 'skipped' });

      // Remove program from tracked list and skip all its tasks
      for (const pid of programIds) {
        todoData.tracked_programs = (todoData.tracked_programs || []).filter(p => (typeof p === 'string' ? p : p.id) !== pid);
        // Mark all tasks that only apply to this program as skipped
        for (const t of (todoData.tasks || [])) {
          if (t.applies_to && t.applies_to.length === 1 && t.applies_to[0] === pid && t.status === 'pending') {
            await apiUpdateTask(t.id, { status: 'skipped' });
          }
        }
        // Remove program from applies_to of cross-program tasks
        for (const t of (todoData.tasks || [])) {
          if (t.applies_to && t.applies_to.includes(pid) && t.applies_to.length > 1) {
            const newApplies = t.applies_to.filter(p => p !== pid);
            await apiUpdateTask(t.id, { applies_to: newApplies });
          }
        }
      }
    }
    // Save updated tracked_programs
    try {
      await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracked_programs: todoData.tracked_programs })
      });
    } catch (e) {
      // tracked_programs update via full save — handled below
    }
    await loadTodoData();
    renderPanel();
  }

  function getProgramName(programId) {
    if (typeof programsMap !== 'undefined' && programsMap[programId]) {
      return programsMap[programId].name;
    }
    // Fallback: format ID
    return programId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDueDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function daysDiff(dateStr) {
    if (!dateStr) return Infinity;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    return Math.floor((due - now) / (1000 * 60 * 60 * 24));
  }

  function getTimeBucket(dateStr) {
    const days = daysDiff(dateStr);
    if (days === Infinity) return 'no_date';
    if (days < 0) return 'overdue';
    if (days <= 7) return 'this_week';
    if (days <= 21) return 'next_2_weeks';
    if (days <= 31) return 'this_month';
    if (days <= 90) return '2_3_months';
    return 'later';
  }

  const BUCKET_ORDER = ['overdue', 'this_week', 'next_2_weeks', 'this_month', '2_3_months', 'later', 'no_date'];
  const BUCKET_LABELS = {
    overdue: 'OVERDUE',
    this_week: 'This Week',
    next_2_weeks: 'Next 2 Weeks',
    this_month: 'This Month',
    '2_3_months': '2-3 Months',
    later: 'Later',
    no_date: 'No Date'
  };

  function getStats(tasks) {
    const active = tasks.filter(t => t.status !== 'done' && t.status !== 'skipped');
    const overdue = active.filter(t => daysDiff(t.due_date) < 0).length;
    const dueSoon = active.filter(t => { const d = daysDiff(t.due_date); return d >= 0 && d <= 7; }).length;
    return { overdue, dueSoon, total: active.length };
  }

  function renderPanel() {
    if (!todoData) return;

    const content = document.getElementById('todos-panel-content');
    if (!content) return;

    let tasks = todoData.tasks || [];

    // Filter by program if set
    if (filterProgram) {
      tasks = tasks.filter(t => (t.applies_to || []).includes(filterProgram));
    }

    // Separate active and completed
    const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'skipped');
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'skipped');

    const stats = getStats(todoData.tasks);

    let html = '';

    // Header with filter and add button
    html += '<div class="todo-header">';
    html += '<div class="todo-header-row">';
    html += '<select class="todo-filter" onchange="TodoPanel.setFilter(this.value)">';
    html += '<option value="">All Programs</option>';
    for (const pid of getTrackedProgramIds()) {
      const selected = pid === filterProgram ? ' selected' : '';
      const status = getAppStatus(pid);
      const statusLabel = APP_STATUS_LABELS[status] || status;
      const statusSuffix = status !== 'not_started' ? ' [' + statusLabel + ']' : '';
      html += '<option value="' + escapeHtml(pid) + '"' + selected + '>' + escapeHtml(getProgramName(pid)) + statusSuffix + '</option>';
    }
    html += '</select>';
    html += '<button class="todo-add-btn" onclick="TodoPanel.showAddForm()">+ Add Task</button>';
    html += '</div>';

    // App status changer (when a program is selected)
    if (filterProgram) {
      const currentStatus = getAppStatus(filterProgram);
      html += '<div class="todo-app-status">';
      html += '<label>App Status:</label>';
      html += '<select class="todo-app-status-select" onchange="TodoPanel.updateAppStatus(\'' + escapeHtml(filterProgram) + '\', this.value)">';
      for (const [val, label] of Object.entries(APP_STATUS_LABELS)) {
        const sel = val === currentStatus ? ' selected' : '';
        html += '<option value="' + val + '"' + sel + '>' + label + '</option>';
      }
      html += '</select>';
      html += '<span class="todo-app-status-dot" style="background:' + (APP_STATUS_COLORS[currentStatus] || '#94a3b8') + '"></span>';
      html += '</div>';
    }

    // Stats line
    html += '<div class="todo-stats">';
    if (stats.overdue > 0) {
      html += '<span class="todo-stat overdue">' + stats.overdue + ' overdue</span>';
    }
    if (stats.dueSoon > 0) {
      html += '<span class="todo-stat due-soon">' + stats.dueSoon + ' due soon</span>';
    }
    html += '<span class="todo-stat">' + stats.total + ' total</span>';
    if (stats.overdue > 0) {
      html += '<span class="todo-hide-overdue" onclick="TodoPanel.toggleHideOverdue()">' + (overdueHidden ? 'Show overdue' : 'Hide overdue') + '</span>';
    }
    html += '</div>';
    html += '</div>';

    // Add task form
    if (showingAddForm) {
      html += renderAddForm();
    }

    // Task list
    if (!filterProgram) {
      // Timeline view with time buckets
      const buckets = {};
      BUCKET_ORDER.forEach(b => buckets[b] = []);

      activeTasks.forEach(t => {
        const bucket = getTimeBucket(t.due_date);
        buckets[bucket].push(t);
      });

      // Sort tasks within each bucket by due date
      for (const b of BUCKET_ORDER) {
        buckets[b].sort((a, b_) => {
          if (!a.due_date && !b_.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b_.due_date) return -1;
          return a.due_date.localeCompare(b_.due_date);
        });
      }

      for (const bucket of BUCKET_ORDER) {
        if (buckets[bucket].length === 0) continue;
        if (bucket === 'overdue' && overdueHidden) continue;
        const bucketClass = bucket === 'overdue' ? ' bucket-overdue' : '';
        html += '<div class="todo-bucket' + bucketClass + '">';
        html += '<div class="todo-bucket-header">' + BUCKET_LABELS[bucket] + ' <span class="todo-bucket-count">' + buckets[bucket].length + '</span></div>';
        for (const task of buckets[bucket]) {
          html += renderTaskCard(task);
        }
        html += '</div>';
      }
    } else {
      // Flat list for program filter
      activeTasks.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
      for (const task of activeTasks) {
        html += renderTaskCard(task);
      }
    }

    // Completed section
    if (completedTasks.length > 0) {
      html += '<div class="todo-bucket bucket-completed">';
      html += '<div class="todo-bucket-header">Completed <span class="todo-bucket-count">' + completedTasks.length + '</span></div>';
      for (const task of completedTasks) {
        html += renderTaskCard(task);
      }
      html += '</div>';
    }

    if (activeTasks.length === 0 && completedTasks.length === 0) {
      html += '<div class="todo-empty">No tasks yet. Click "+ Add Task" to create one.</div>';
    }

    content.innerHTML = html;
  }

  function renderTaskCard(task) {
    const isExpanded = expandedTaskId === task.id;
    const isDone = task.status === 'done' || task.status === 'skipped';
    const days = daysDiff(task.due_date);
    const isOverdue = !isDone && days < 0;
    const isDueSoon = !isDone && days >= 0 && days <= 7;

    let dueDateClass = 'todo-due';
    if (isOverdue) dueDateClass += ' overdue';
    else if (isDueSoon) dueDateClass += ' due-soon';

    const checkClass = isDone ? 'checked' : '';
    const cardClass = 'todo-card' + (isDone ? ' done' : '') + (isExpanded ? ' expanded' : '');

    // Subtitle: program count + category
    const appliesTo = task.applies_to || [];
    let subtitle = '';
    if (appliesTo.length === 0) {
      subtitle = CATEGORY_LABELS[task.category] || task.category;
    } else if (appliesTo.length === 1) {
      subtitle = escapeHtml(getProgramName(appliesTo[0]));
    } else if (appliesTo.length === getTrackedProgramIds().length) {
      subtitle = 'all programs';
    } else {
      subtitle = appliesTo.length + ' programs';
    }
    subtitle += ' &middot; ' + (CATEGORY_LABELS[task.category] || task.category);

    let html = '<div class="' + cardClass + '" data-task-id="' + task.id + '">';

    // Main row
    html += '<div class="todo-card-main" onclick="TodoPanel.toggleExpand(\'' + task.id + '\')">';
    html += '<div class="todo-checkbox ' + checkClass + '" onclick="event.stopPropagation(); TodoPanel.toggleStatus(\'' + task.id + '\')"></div>';
    html += '<div class="todo-card-body">';
    html += '<div class="todo-card-title">' + escapeHtml(task.title) + '</div>';
    html += '<div class="todo-card-subtitle">' + subtitle + '</div>';
    html += '</div>';
    if (task.due_date) {
      html += '<div class="' + dueDateClass + '">' + formatDueDate(task.due_date) + '</div>';
    }
    html += '</div>';

    // Expanded detail
    if (isExpanded) {
      html += '<div class="todo-card-detail">';

      // Notes
      html += '<div class="todo-detail-field">';
      html += '<label>Notes</label>';
      html += '<textarea class="todo-notes" id="todo-notes-' + task.id + '" onchange="TodoPanel.updateNotes(\'' + task.id + '\', this.value)">' + escapeHtml(task.notes || '') + '</textarea>';
      html += '</div>';

      // Due date edit
      html += '<div class="todo-detail-field">';
      html += '<label>Due Date</label>';
      html += '<input type="date" class="todo-date-input" value="' + (task.due_date || '') + '" onchange="TodoPanel.updateDueDate(\'' + task.id + '\', this.value)">';
      if (task.due_reason) {
        html += '<div class="todo-due-reason">' + escapeHtml(task.due_reason) + '</div>';
      }
      html += '</div>';

      // Status
      html += '<div class="todo-detail-field">';
      html += '<label>Status</label>';
      html += '<select class="todo-status-select" onchange="TodoPanel.updateStatus(\'' + task.id + '\', this.value)">';
      const statuses = ['pending', 'in_progress', 'done', 'skipped'];
      for (const s of statuses) {
        const sel = s === task.status ? ' selected' : '';
        html += '<option value="' + s + '"' + sel + '>' + s.replace('_', ' ') + '</option>';
      }
      html += '</select>';
      html += '</div>';

      // Applies to
      if (appliesTo.length > 0) {
        html += '<div class="todo-detail-field">';
        html += '<label>Applies to</label>';
        html += '<div class="todo-applies-list">';
        for (const pid of appliesTo) {
          html += '<span class="todo-program-chip">' + escapeHtml(getProgramName(pid)) + '</span>';
        }
        html += '</div>';
        html += '</div>';
      }

      // Delete button
      html += '<div class="todo-detail-actions">';
      html += '<button class="todo-delete-btn" onclick="TodoPanel.deleteTask(\'' + task.id + '\')">Delete task</button>';
      html += '</div>';

      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderAddForm() {
    let html = '<div class="todo-add-form">';
    html += '<div class="form-header">';
    html += '<h4>Add Task</h4>';
    html += '<button class="btn-icon" onclick="TodoPanel.cancelAddForm()">\u2715</button>';
    html += '</div>';

    html += '<div class="form-field">';
    html += '<label>Title</label>';
    html += '<input type="text" id="todo-new-title" placeholder="Task title...">';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-field">';
    html += '<label>Category</label>';
    html += '<select id="todo-new-category">';
    for (const cat of CATEGORIES) {
      html += '<option value="' + cat + '">' + cat + '</option>';
    }
    html += '</select>';
    html += '</div>';

    html += '<div class="form-field">';
    html += '<label>Due Date</label>';
    html += '<input type="date" id="todo-new-due-date">';
    html += '</div>';
    html += '</div>';

    // Applies to multi-select
    html += '<div class="form-field">';
    html += '<label>Applies to <span class="form-hint">(click to select)</span></label>';
    html += '<div class="todo-program-chips">';
    for (const pid of getTrackedProgramIds()) {
      html += '<span class="todo-program-chip selectable" data-pid="' + escapeHtml(pid) + '" onclick="TodoPanel.toggleProgramChip(this)">' + escapeHtml(getProgramName(pid)) + '</span>';
    }
    html += '</div>';
    html += '</div>';

    html += '<div class="form-field">';
    html += '<label>Notes</label>';
    html += '<textarea id="todo-new-notes" placeholder="Optional notes..."></textarea>';
    html += '</div>';

    html += '<div class="form-actions">';
    html += '<button class="btn-save" onclick="TodoPanel.saveNewTask()">Add</button>';
    html += '<button class="btn-cancel" onclick="TodoPanel.cancelAddForm()">Cancel</button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  // ===== INTERACTIONS =====

  function toggleHideOverdue() {
    overdueHidden = !overdueHidden;
    renderPanel();
  }

  function setFilter(programId) {
    filterProgram = programId;
    expandedTaskId = null;
    renderPanel();
  }

  function toggleExpand(taskId) {
    expandedTaskId = expandedTaskId === taskId ? null : taskId;
    renderPanel();
  }

  async function toggleStatus(taskId) {
    const task = (todoData.tasks || []).find(t => t.id === taskId);
    if (!task) return;

    const newStatus = (task.status === 'done') ? 'pending' : 'done';
    await apiUpdateTask(taskId, { status: newStatus });
  }

  async function updateStatus(taskId, status) {
    await apiUpdateTask(taskId, { status: status });
  }

  async function updateNotes(taskId, notes) {
    await apiUpdateTask(taskId, { notes: notes });
  }

  async function updateDueDate(taskId, dueDate) {
    await apiUpdateTask(taskId, { due_date: dueDate || null });
  }

  async function updateAppStatus(programId, newStatus) {
    if (!todoData) return;
    // Update the tracked_programs entry
    const programs = todoData.tracked_programs || [];
    const updated = programs.map(p => {
      const pid = typeof p === 'string' ? p : p.id;
      if (pid === programId) {
        return { id: pid, app_status: newStatus };
      }
      return typeof p === 'string' ? { id: p, app_status: 'not_started' } : p;
    });
    todoData.tracked_programs = updated;
    try {
      await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracked_programs: updated })
      });
      renderPanel();
    } catch (e) {
      alert('Error updating app status: ' + e.message);
    }
  }

  async function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;

    try {
      const response = await fetch('/api/todos/tasks/' + encodeURIComponent(taskId), {
        method: 'DELETE'
      });
      if (!response.ok && response.status !== 204) {
        alert('Failed to delete task');
        return;
      }
      await loadTodoData();
      expandedTaskId = null;
      renderPanel();
    } catch (e) {
      alert('Error deleting task: ' + e.message);
    }
  }

  function showAddForm() {
    showingAddForm = true;
    expandedTaskId = null;
    renderPanel();
    // Scroll form into view
    const form = document.querySelector('.todo-add-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function cancelAddForm() {
    showingAddForm = false;
    renderPanel();
  }

  function toggleProgramChip(el) {
    el.classList.toggle('active');
  }

  async function saveNewTask() {
    const title = document.getElementById('todo-new-title').value.trim();
    if (!title) {
      alert('Title is required');
      return;
    }

    const category = document.getElementById('todo-new-category').value;
    const dueDate = document.getElementById('todo-new-due-date').value || null;
    const notes = document.getElementById('todo-new-notes').value.trim();

    // Get selected programs
    const selectedPrograms = [];
    document.querySelectorAll('.todo-program-chips .todo-program-chip.active').forEach(el => {
      selectedPrograms.push(el.dataset.pid);
    });

    // Generate unique ID
    const maxNum = (todoData.tasks || []).reduce((max, t) => {
      const m = t.id.match(/^task-(\d+)$/);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    const newId = 'task-' + String(maxNum + 1).padStart(3, '0');

    const task = {
      id: newId,
      title: title,
      category: category,
      due_date: dueDate,
      applies_to: selectedPrograms,
      notes: notes
    };

    try {
      const response = await fetch('/api/todos/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Failed to create task');
        return;
      }
      showingAddForm = false;
      await loadTodoData();
      renderPanel();
    } catch (e) {
      alert('Error creating task: ' + e.message);
    }
  }

  // ===== API HELPERS =====

  async function apiUpdateTask(taskId, updates) {
    try {
      const response = await fetch('/api/todos/tasks/' + encodeURIComponent(taskId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Failed to update task');
        return;
      }
      await loadTodoData();
      renderPanel();
    } catch (e) {
      alert('Error updating task: ' + e.message);
    }
  }

  function isTracked(programId) {
    return getTrackedProgramIds().includes(programId);
  }

  async function addTrackedProgram(programId, program) {
    if (!todoData) return;
    if (isTracked(programId)) return;
    todoData.tracked_programs = todoData.tracked_programs || [];
    todoData.tracked_programs.push({ id: programId, app_status: 'not_started' });
    try {
      await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracked_programs: todoData.tracked_programs })
      });
      // Generate tasks for the newly tracked program
      if (program) {
        await generateTasksForProgram(program);
      }
      renderPanel();
    } catch (e) {
      console.error('Error adding tracked program:', e);
    }
  }

  // ===== TASK GENERATION FOR NEW TRACKED PROGRAMS =====

  const LEAD_DAYS = {
    exam: 30, personal_statement: 14, resume: 14, bls: 30,
    transcript: 4, reference: 30, nursingcas_setup: 14,
    background_check: 14, supplemental_essay: 14
  };

  function subtractDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  function nextTaskId() {
    const tasks = (todoData && todoData.tasks) || [];
    const maxNum = tasks.reduce(function(max, t) {
      const m = t.id.match(/^task-(\d+)$/);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    return 'task-' + String(maxNum + 1).padStart(3, '0');
  }

  function getEffectiveDeadline(program) {
    var deadline = program.admissions && program.admissions.deadline;
    if (deadline) return deadline;
    var startDate = program.admissions && program.admissions.start_date;
    if (startDate) return subtractDays(startDate, 120);
    return null;
  }

  function taskExistsForProgram(programId, titleSubstring) {
    var tasks = (todoData && todoData.tasks) || [];
    return tasks.find(function(t) {
      return t.status !== 'skipped' && t.title.toLowerCase().includes(titleSubstring.toLowerCase()) &&
        (t.applies_to || []).includes(programId);
    });
  }

  function findCrossTask(titleSubstring) {
    var tasks = (todoData && todoData.tasks) || [];
    return tasks.find(function(t) {
      return t.status !== 'skipped' && t.title.toLowerCase().includes(titleSubstring.toLowerCase());
    });
  }

  async function apiCreateTask(task) {
    try {
      var response = await fetch('/api/todos/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (!response.ok) {
        console.error('Failed to create task:', task.title);
      }
    } catch (e) {
      console.error('Error creating task:', e);
    }
  }

  async function addProgramToCrossTask(existingTask, programId) {
    if ((existingTask.applies_to || []).includes(programId)) return;
    var newAppliesTo = (existingTask.applies_to || []).concat([programId]);
    await apiUpdateTask(existingTask.id, { applies_to: newAppliesTo });
  }

  async function generateTasksForProgram(program) {
    var reqs = program.application_requirements || null;
    var deadline = getEffectiveDeadline(program);
    var today = new Date().toISOString().split('T')[0];
    var programId = program.id;
    var programName = program.name;

    // If no application_requirements, create a research task, queue for research, and alert user
    if (!reqs || reqs.research_status === 'pending') {
      var researchMsg = reqs ? 'partial' : 'missing';
      if (!taskExistsForProgram(programId, 'research') && !taskExistsForProgram(programId, 'verify')) {
        await apiCreateTask({
          id: nextTaskId(),
          title: 'Research ' + programName + ' application requirements',
          category: 'verification',
          status: 'pending',
          due_date: deadline ? subtractDays(deadline, 45) : null,
          due_reason: deadline ? programName + ' deadline' : '',
          applies_to: [programId],
          notes: 'Application requirements data is ' + researchMsg + '. Visit the program website to confirm: fees, essays, references, exam requirements, certifications, and deadlines.',
          auto_generated: true,
          created_at: today,
          completed_at: null
        });
      }
      // Queue for research
      try {
        await fetch('/api/research-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_id: programId,
            program_name: programName,
            reason: 'No application_requirements data',
            fields_needed: ['fee', 'system', 'essays', 'references', 'exam', 'certifications', 'resume', 'background_check', 'interview', 'deposit', 'unique']
          })
        });
      } catch (e) {
        console.error('Error queuing for research:', e);
      }
      alert(programName + ' added to tracked programs.\n\nApplication requirements have not been researched. Queued for research \u2014 Claude Code will pick this up next session.');
      await loadTodoData();
      return;
    }

    var newTaskCount = 0;

    // --- Cross-program tasks: add this program to existing or create new ---

    // TEAS exam
    if (reqs.exam === 'teas' || reqs.exam === 'teas_or_hesi') {
      var existing = findCrossTask('take teas');
      if (existing) {
        await addProgramToCrossTask(existing, programId);
      } else {
        await apiCreateTask({
          id: nextTaskId(), title: 'Take TEAS exam', category: 'exam', status: 'pending',
          due_date: deadline ? subtractDays(deadline, LEAD_DAYS.exam) : null,
          due_reason: deadline ? programName + ' deadline' : '',
          applies_to: [programId],
          notes: 'Register at atitesting.com. Score valid 24 months.',
          auto_generated: true, created_at: today, completed_at: null
        });
        newTaskCount++;
      }
    }

    // HESI exam
    if (reqs.exam === 'hesi' || reqs.exam === 'teas_or_hesi') {
      var existing = findCrossTask('take hesi');
      if (existing) {
        await addProgramToCrossTask(existing, programId);
      } else {
        await apiCreateTask({
          id: nextTaskId(), title: 'Take HESI A2 exam', category: 'exam', status: 'pending',
          due_date: deadline ? subtractDays(deadline, LEAD_DAYS.exam) : null,
          due_reason: deadline ? programName + ' deadline' : '',
          applies_to: [programId],
          notes: 'Register through your testing center.',
          auto_generated: true, created_at: today, completed_at: null
        });
        newTaskCount++;
      }
    }

    // Personal statement (transferable)
    var hasTransferablePS = (reqs.essays || []).some(function(e) { return e.type === 'personal_statement' && e.transferable; });
    if (hasTransferablePS) {
      var existing = findCrossTask('personal statement');
      if (existing) {
        await addProgramToCrossTask(existing, programId);
      } else {
        await apiCreateTask({
          id: nextTaskId(), title: 'Write personal statement', category: 'document', status: 'pending',
          due_date: deadline ? subtractDays(deadline, LEAD_DAYS.personal_statement) : null,
          due_reason: deadline ? programName + ' deadline' : '',
          applies_to: [programId],
          notes: 'Most programs want: why nursing, career goals, relevant experience. Reusable across programs.',
          auto_generated: true, created_at: today, completed_at: null
        });
        newTaskCount++;
      }
    }

    // Resume
    if (reqs.resume) {
      var existing = findCrossTask('resume');
      if (existing) {
        await addProgramToCrossTask(existing, programId);
      } else {
        await apiCreateTask({
          id: nextTaskId(), title: 'Prepare resume/CV', category: 'document', status: 'pending',
          due_date: deadline ? subtractDays(deadline, LEAD_DAYS.resume) : null,
          due_reason: deadline ? programName + ' deadline' : '',
          applies_to: [programId],
          notes: 'Highlight healthcare-relevant experience, volunteer work, education.',
          auto_generated: true, created_at: today, completed_at: null
        });
        newTaskCount++;
      }
    }

    // BLS certification
    if ((reqs.certifications || []).includes('bls')) {
      var existing = findCrossTask('bls');
      if (existing) {
        await addProgramToCrossTask(existing, programId);
      } else {
        await apiCreateTask({
          id: nextTaskId(), title: 'Complete BLS certification', category: 'verification', status: 'pending',
          due_date: deadline ? subtractDays(deadline, LEAD_DAYS.bls) : null,
          due_reason: deadline ? programName + ' deadline' : '',
          applies_to: [programId],
          notes: 'American Heart Association BLS for Healthcare Providers. Valid 2 years.',
          auto_generated: true, created_at: today, completed_at: null
        });
        newTaskCount++;
      }
    }

    // NursingCAS setup
    if (reqs.system === 'nursingcas' || reqs.system === 'both') {
      var existing = findCrossTask('nursingcas account');
      if (existing) {
        await addProgramToCrossTask(existing, programId);
      } else {
        await apiCreateTask({
          id: nextTaskId(), title: 'Set up NursingCAS account', category: 'application', status: 'pending',
          due_date: deadline ? subtractDays(deadline, LEAD_DAYS.nursingcas_setup) : null,
          due_reason: deadline ? programName + ' deadline' : '',
          applies_to: [programId],
          notes: 'Create account at nursingcas.liaisoncas.com. Upload transcripts, enter coursework.',
          auto_generated: true, created_at: today, completed_at: null
        });
        newTaskCount++;
      }
    }

    // Background check
    if (reqs.background_check) {
      var existing = findCrossTask('background check');
      if (existing) {
        await addProgramToCrossTask(existing, programId);
      } else {
        await apiCreateTask({
          id: nextTaskId(), title: 'Complete background check', category: 'verification', status: 'pending',
          due_date: deadline ? subtractDays(deadline, LEAD_DAYS.background_check) : null,
          due_reason: deadline ? programName + ' deadline' : '',
          applies_to: [programId],
          notes: 'Most programs use CastleBranch or similar.',
          auto_generated: true, created_at: today, completed_at: null
        });
        newTaskCount++;
      }
    }

    // Reference letters — add to existing cross-tasks or create new
    var refsNeeded = (reqs.references && reqs.references.count) || 0;
    for (var i = 1; i <= refsNeeded; i++) {
      var existing = findCrossTask('reference letter #' + i);
      if (existing) {
        await addProgramToCrossTask(existing, programId);
      } else {
        await apiCreateTask({
          id: nextTaskId(), title: 'Request reference letter #' + i, category: 'document', status: 'pending',
          due_date: deadline ? subtractDays(deadline, LEAD_DAYS.reference) : null,
          due_reason: deadline ? programName + ' deadline' : '',
          applies_to: [programId],
          notes: (reqs.references && reqs.references.notes) || 'Academic or professional.',
          auto_generated: true, created_at: today, completed_at: null
        });
        newTaskCount++;
      }
    }

    // --- Per-school tasks ---

    // Submit application
    var systemLabel = reqs.system === 'nursingcas' ? 'NursingCAS'
      : reqs.system === 'both' ? 'NursingCAS + supplemental'
      : reqs.system === 'direct' ? 'direct'
      : 'application';

    if (!taskExistsForProgram(programId, 'submit')) {
      await apiCreateTask({
        id: nextTaskId(), title: 'Submit ' + systemLabel + ' application — ' + programName,
        category: 'application', status: 'pending',
        due_date: deadline, due_reason: deadline ? programName + ' deadline' : '',
        applies_to: [programId], notes: reqs.system_notes || '',
        auto_generated: true, created_at: today, completed_at: null
      });
      newTaskCount++;
    }

    // Application fee
    if (reqs.fee && !taskExistsForProgram(programId, 'fee')) {
      await apiCreateTask({
        id: nextTaskId(), title: 'Pay ' + programName + ' application fee ($' + reqs.fee + ')',
        category: 'fee', status: 'pending',
        due_date: deadline, due_reason: deadline ? programName + ' deadline' : '',
        applies_to: [programId], notes: reqs.system_notes || '',
        auto_generated: true, created_at: today, completed_at: null
      });
      newTaskCount++;
    }

    // Supplemental essays (non-transferable)
    var supplementals = (reqs.essays || []).filter(function(e) { return !e.transferable; });
    for (var si = 0; si < supplementals.length; si++) {
      var essay = supplementals[si];
      if (!taskExistsForProgram(programId, essay.label || essay.type)) {
        await apiCreateTask({
          id: nextTaskId(), title: 'Write ' + programName + ' essay: ' + (essay.label || essay.type),
          category: 'document', status: 'pending',
          due_date: deadline ? subtractDays(deadline, LEAD_DAYS.supplemental_essay) : null,
          due_reason: deadline ? programName + ' deadline' : '',
          applies_to: [programId],
          notes: essay.word_range ? 'Word range: ' + essay.word_range[0] + '-' + essay.word_range[1] : '',
          auto_generated: true, created_at: today, completed_at: null
        });
        newTaskCount++;
      }
    }

    // Interview prep
    if ((reqs.interview === 'required' || reqs.interview === 'by_invitation') && !taskExistsForProgram(programId, 'interview')) {
      await apiCreateTask({
        id: nextTaskId(), title: 'Prepare for ' + programName + ' interview',
        category: 'application', status: 'pending',
        due_date: null, due_reason: reqs.interview === 'by_invitation' ? 'After invitation received' : '',
        applies_to: [programId],
        notes: reqs.interview === 'by_invitation'
          ? 'Interview by invitation only. Prepare: why this program, career goals, clinical interests.'
          : 'Prepare: why this program, career goals, clinical interests.',
        auto_generated: true, created_at: today, completed_at: null
      });
      newTaskCount++;
    }

    // Deposit
    if (reqs.deposit && !taskExistsForProgram(programId, 'deposit')) {
      await apiCreateTask({
        id: nextTaskId(), title: 'Pay ' + programName + ' enrollment deposit ($' + reqs.deposit.amount + ')',
        category: 'fee', status: 'pending',
        due_date: null, due_reason: reqs.deposit.timing || 'After admission',
        applies_to: [programId],
        notes: (reqs.deposit.refundable ? 'Refundable' : 'Non-refundable') + '. ' + (reqs.deposit.timing || ''),
        auto_generated: true, created_at: today, completed_at: null
      });
      newTaskCount++;
    }

    // Unique requirements (skip informational items)
    var uniques = reqs.unique || [];
    for (var ui = 0; ui < uniques.length; ui++) {
      var item = uniques[ui];
      var lower = item.toLowerCase();
      if (lower.includes('max ') || lower.includes('all prereqs') || lower.includes('summer start only') || lower.includes('rolling admissions')) continue;
      if (!taskExistsForProgram(programId, item.substring(0, 30))) {
        await apiCreateTask({
          id: nextTaskId(), title: programName + ': ' + item,
          category: 'verification', status: 'pending',
          due_date: deadline ? subtractDays(deadline, 30) : null,
          due_reason: deadline ? programName + ' deadline' : '',
          applies_to: [programId], notes: '',
          auto_generated: true, created_at: today, completed_at: null
        });
        newTaskCount++;
      }
    }

    // Verification task for programs without verified data
    var verifConf = program.verification && program.verification.confidence;
    if (verifConf !== 'verified' && !taskExistsForProgram(programId, 'verify')) {
      await apiCreateTask({
        id: nextTaskId(), title: 'Verify ' + programName + ' requirements',
        category: 'verification', status: 'pending',
        due_date: deadline ? subtractDays(deadline, 45) : null,
        due_reason: deadline ? programName + ' deadline' : '',
        applies_to: [programId],
        notes: 'Confidence: ' + (verifConf || 'unknown') + '. Check official website for current prereqs and deadlines.',
        auto_generated: true, created_at: today, completed_at: null
      });
      newTaskCount++;
    }

    // Queue for research if partial data
    if (reqs.research_status === 'partial') {
      var missingFields = [];
      if (reqs.fee == null) missingFields.push('fee');
      if (!reqs.system) missingFields.push('system');
      if (!reqs.essays || reqs.essays.length === 0) missingFields.push('essays');
      if (!reqs.references) missingFields.push('references');
      if (reqs.exam === undefined) missingFields.push('exam');
      if (!reqs.certifications) missingFields.push('certifications');
      if (reqs.resume == null) missingFields.push('resume');
      if (reqs.background_check == null) missingFields.push('background_check');
      if (!reqs.interview) missingFields.push('interview');
      if (reqs.deposit === undefined) missingFields.push('deposit');
      if (!reqs.unique) missingFields.push('unique');
      try {
        await fetch('/api/research-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_id: programId,
            program_name: programName,
            reason: 'Partial application_requirements data',
            fields_needed: missingFields.length > 0 ? missingFields : ['verify_all']
          })
        });
      } catch (e) {
        console.error('Error queuing for research:', e);
      }
    }

    // Reload data to pick up all new tasks
    await loadTodoData();

    // Notify user
    var researchNote = reqs.research_status === 'partial'
      ? '\n\nSome application requirements are incomplete. Queued for verification.'
      : '';
    alert(programName + ' added to tracked programs.\n' + newTaskCount + ' new tasks generated.' + researchNote);
  }

  async function removeTrackedProgram(programId) {
    if (!todoData) return;
    todoData.tracked_programs = (todoData.tracked_programs || []).filter(p =>
      (typeof p === 'string' ? p : p.id) !== programId
    );
    try {
      await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracked_programs: todoData.tracked_programs })
      });
      renderPanel();
    } catch (e) {
      console.error('Error removing tracked program:', e);
    }
  }

  function getTrackedFeeTotal(programsMapRef) {
    const ids = getTrackedProgramIds();
    let total = 0;
    let unknownCount = 0;
    for (const id of ids) {
      const prog = programsMapRef && programsMapRef[id];
      if (prog && prog.application_requirements && prog.application_requirements.fee != null) {
        total += prog.application_requirements.fee;
      } else {
        unknownCount++;
      }
    }
    return { total: total, unknownCount: unknownCount };
  }

  return {
    loadTodoData,
    renderPanel,
    toggleHideOverdue,
    setFilter,
    toggleExpand,
    toggleStatus,
    updateStatus,
    updateNotes,
    updateDueDate,
    updateAppStatus,
    deleteTask,
    showAddForm,
    cancelAddForm,
    toggleProgramChip,
    saveNewTask,
    getTodoData: function () { return todoData; },
    isTracked,
    addTrackedProgram,
    removeTrackedProgram,
    getTrackedFeeTotal,
    getTrackedProgramIds: function () { return getTrackedProgramIds(); }
  };
})();
