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

  const CATEGORIES = ['application', 'document', 'exam', 'verification', 'course', 'custom'];

  const CATEGORY_LABELS = {
    application: 'application',
    document: 'document',
    exam: 'exam',
    verification: 'verification',
    course: 'course',
    custom: 'custom'
  };

  async function loadTodoData() {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to load todos');
      todoData = await response.json();
      return todoData;
    } catch (e) {
      console.error('Error loading todo data:', e);
      todoData = { tracked_programs: [], tasks: [], settings: {} };
      return todoData;
    }
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
    for (const pid of (todoData.tracked_programs || [])) {
      const selected = pid === filterProgram ? ' selected' : '';
      html += '<option value="' + escapeHtml(pid) + '"' + selected + '>' + escapeHtml(getProgramName(pid)) + '</option>';
    }
    html += '</select>';
    html += '<button class="todo-add-btn" onclick="TodoPanel.showAddForm()">+ Add Task</button>';
    html += '</div>';

    // Stats line
    html += '<div class="todo-stats">';
    if (stats.overdue > 0) {
      html += '<span class="todo-stat overdue">' + stats.overdue + ' overdue</span>';
    }
    if (stats.dueSoon > 0) {
      html += '<span class="todo-stat due-soon">' + stats.dueSoon + ' due soon</span>';
    }
    html += '<span class="todo-stat">' + stats.total + ' total</span>';
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
    } else if (todoData.tracked_programs && appliesTo.length === todoData.tracked_programs.length) {
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
    for (const pid of (todoData.tracked_programs || [])) {
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

  return {
    loadTodoData,
    renderPanel,
    setFilter,
    toggleExpand,
    toggleStatus,
    updateStatus,
    updateNotes,
    updateDueDate,
    deleteTask,
    showAddForm,
    cancelAddForm,
    toggleProgramChip,
    saveNewTask,
    getTodoData: function () { return todoData; }
  };
})();
