/**
 * Courses Side Panel
 *
 * Manages the "My Courses" side panel UI: rendering semester groups,
 * add/edit/delete course forms, and auto-suggest prereq tags.
 */

const CoursesPanel = (function () {

  let courseData = null; // { semesters, courses, transcript }
  let editingCourseId = null;
  let transcriptExpanded = false;

  // Keyword -> tag mappings for auto-suggest
  const KEYWORD_TAG_MAP = [
    { keywords: ['microbiology', 'micro bio'], tag: 'micro' },
    { keywords: ['anatomy and physiology 1', 'a&p 1', 'a&p i', 'general a&p', 'anatomy & physiology i', 'human anatomy'], tag: 'ap1' },
    { keywords: ['anatomy and physiology 2', 'a&p 2', 'a&p ii', 'advanced a&p', 'anatomy & physiology ii'], tag: 'ap2' },
    { keywords: ['anatomy and physiology', 'anatomy & physiology', 'a&p'], tag: 'ap1' },
    { keywords: ['general chemistry', 'gen chem', 'chemistry 806', 'chem for health'], tag: 'chem' },
    { keywords: ['chemistry lab', 'chem lab', 'chemistry 806-134'], tag: 'gen_chem_lab' },
    { keywords: ['organic chemistry', 'organic chem', 'orgo'], tag: 'organic_chem' },
    { keywords: ['biochemistry', 'biochem'], tag: 'biochemistry' },
    { keywords: ['statistics', 'stats', 'stat '], tag: 'stats' },
    { keywords: ['lifespan', 'developmental psych', 'human development', 'dev psych'], tag: 'lifespan' },
    { keywords: ['nutrition', 'nutr'], tag: 'nutrition' },
    { keywords: ['general psychology', 'intro to psych', 'intro psych', 'psych 101', 'psych 202'], tag: 'psych' },
    { keywords: ['abnormal psych', 'psychopathology'], tag: 'abnormal_psych' },
    { keywords: ['sociology', 'intro to soc'], tag: 'sociology' },
    { keywords: ['biology', 'bio 101', 'gen bio', 'general biology'], tag: 'biology' },
    { keywords: ['gen biology'], tag: 'gen_biology' },
    { keywords: ['ethics', 'medical ethics', 'health care ethics', 'bioethics'], tag: 'ethics' },
    { keywords: ['philosophy', 'philos'], tag: 'philosophy' },
    { keywords: ['pathophysiology', 'pathophys', 'pathobiology'], tag: 'pathophysiology' },
    { keywords: ['pharmacology', 'pharmacotherapy', 'pharm '], tag: 'pharmacology' },
    { keywords: ['genetics', 'human genetics'], tag: 'genetics' },
    { keywords: ['english comp', 'english 100', 'college composition', 'eng comp', 'technical writing'], tag: 'english_comp' },
    { keywords: ['speech', 'oral comm', 'com arts', 'public speaking', 'interpersonal comm'], tag: 'speech_comm' },
    { keywords: ['fine arts', 'visual arts', 'performing arts', 'music', 'art history'], tag: 'fine_arts' },
    { keywords: ['history', 'american history', 'us history', 'u.s. history'], tag: 'history' },
    { keywords: ['us government', 'american politics', 'poli sci', 'political science', 'federal gov'], tag: 'us_government' },
    { keywords: ['texas government', 'tx gov'], tag: 'tx_government' },
    { keywords: ['theology', 'religion', 'bible', 'world religion'], tag: 'theology' },
    { keywords: ['college algebra', 'algebra', 'calculus', 'finite math', 'math 221'], tag: 'college_algebra' },
    { keywords: ['cultural diversity', 'multicultural', 'african american studies', 'ethnic studies'], tag: 'cultural_diversity' },
    { keywords: ['critical thinking'], tag: 'critical_thinking' },
    { keywords: ['epidemiology'], tag: 'epidemiology' },
    { keywords: ['foreign language', 'spanish', 'french', 'german'], tag: 'foreign_language' },
    { keywords: ['teas', 'ati teas'], tag: 'teas' },
    { keywords: ['hesi'], tag: 'hesi' },
    { keywords: ['gre'], tag: 'gre' },
    { keywords: ['cna', 'nurse aide'], tag: 'cna' },
    { keywords: ['bls', 'cpr', 'basic life support'], tag: 'bls' },
    { keywords: ['clep nutrition', 'nutrition clep'], tag: 'nutrition' }
  ];

  // All known tags for the tag chip UI
  const ALL_TAGS = [
    'ap1', 'ap2', 'micro', 'stats', 'chem', 'gen_chem_lab', 'lifespan', 'nutrition',
    'psych', 'sociology', 'biology', 'ethics',
    'pathophysiology', 'pharmacology', 'organic_chem', 'biochemistry', 'chem_sequence',
    'genetics', 'gen_biology', 'english_comp', 'speech_comm', 'fine_arts',
    'history', 'us_government', 'tx_government', 'theology', 'college_algebra',
    'abnormal_psych', 'cultural_diversity', 'philosophy', 'critical_thinking',
    'epidemiology', 'foreign_language',
    'teas', 'hesi', 'gre', 'cna', 'bls', 'healthcare_exp'
  ];

  const TAG_LABELS = {
    ap1: 'A&P 1', ap2: 'A&P 2', micro: 'Microbiology', stats: 'Statistics',
    chem: 'Chemistry', gen_chem_lab: 'Chem Lab', lifespan: 'Lifespan Psych',
    nutrition: 'Nutrition', psych: 'Gen Psych', sociology: 'Sociology',
    biology: 'Biology', ethics: 'Ethics', pathophysiology: 'Pathophysiology',
    pharmacology: 'Pharmacology', organic_chem: 'Organic Chem',
    biochemistry: 'Biochemistry', chem_sequence: 'Chem Sequence',
    genetics: 'Genetics', gen_biology: 'Gen Biology',
    english_comp: 'English Comp', speech_comm: 'Speech/Comm',
    fine_arts: 'Fine Arts', history: 'History', us_government: 'US Gov',
    tx_government: 'TX Gov', theology: 'Theology', college_algebra: 'College Algebra',
    abnormal_psych: 'Abnormal Psych', cultural_diversity: 'Cultural Diversity',
    philosophy: 'Philosophy', critical_thinking: 'Critical Thinking',
    epidemiology: 'Epidemiology', foreign_language: 'Foreign Language',
    teas: 'TEAS', hesi: 'HESI', gre: 'GRE', cna: 'CNA', bls: 'BLS',
    healthcare_exp: 'Healthcare Exp'
  };

  function suggestTags(courseName) {
    const name = courseName.toLowerCase();
    const suggested = new Set();

    for (const mapping of KEYWORD_TAG_MAP) {
      for (const keyword of mapping.keywords) {
        if (name.includes(keyword)) {
          suggested.add(mapping.tag);
        }
      }
    }
    return Array.from(suggested);
  }

  async function loadCourseData() {
    const response = await fetch('/api/courses');
    if (!response.ok) throw new Error('Failed to load courses');
    courseData = await response.json();
    return courseData;
  }

  function togglePanel() {
    // Delegate to global togglePanel
    if (typeof window.togglePanel === 'function') {
      window.togglePanel('courses');
    }
  }

  function renderPanel() {
    if (!courseData) return;

    const content = document.getElementById('courses-panel-content');
    let html = '';

    // Current/planned courses by semester
    html += '<div class="courses-section">';
    html += '<h3>Current & Planned</h3>';

    const semesters = courseData.semesters || {};
    const courses = courseData.courses || [];

    // Group courses by semester
    const bySemester = {};
    for (const semKey of Object.keys(semesters)) {
      bySemester[semKey] = courses.filter(c => c.semester === semKey);
    }

    for (const [semKey, sem] of Object.entries(semesters)) {
      const semCourses = bySemester[semKey] || [];
      html += '<div class="semester-group">';
      html += '<div class="semester-header">';
      html += '<span class="semester-label">' + escapeHtml(sem.label) + '</span>';
      html += '<span class="semester-date">ends ' + sem.end_date + '</span>';
      html += '</div>';

      for (const course of semCourses) {
        html += renderCourseCard(course);
      }

      html += '<button class="add-course-btn" onclick="CoursesPanel.showAddForm(\'' + semKey + '\')">+ Add Course</button>';
      html += '</div>';
    }

    html += '</div>';

    // Transcript section (collapsed by default)
    html += '<div class="courses-section transcript-section">';
    html += '<h3 class="collapsible" onclick="CoursesPanel.toggleTranscript()">';
    html += '<span class="collapse-icon">' + (transcriptExpanded ? '▾' : '▸') + '</span>';
    html += ' Transcript (UW-Madison)';
    html += '<span class="transcript-count">' + (courseData.transcript || []).length + ' courses</span>';
    html += '</h3>';

    if (transcriptExpanded) {
      html += '<div class="transcript-list">';
      for (const course of (courseData.transcript || [])) {
        html += renderTranscriptItem(course);
      }
      html += '</div>';
    }

    html += '</div>';

    // Add course form (hidden by default)
    html += '<div id="add-course-form" class="add-form hidden"></div>';

    content.innerHTML = html;
  }

  function renderCourseCard(course) {
    let html = '<div class="course-card" data-id="' + course.id + '">';
    html += '<div class="course-card-header">';
    html += '<span class="course-name">' + escapeHtml(course.name) + '</span>';
    html += '<div class="course-actions">';
    html += '<button class="btn-icon" onclick="CoursesPanel.editCourse(\'' + course.id + '\')" title="Edit">✎</button>';
    html += '<button class="btn-icon btn-delete" onclick="CoursesPanel.deleteCourse(\'' + course.id + '\')" title="Delete">✕</button>';
    html += '</div>';
    html += '</div>';
    html += '<div class="course-meta">';
    html += '<span class="course-institution">' + escapeHtml(course.institution || '') + '</span>';
    if (course.online) html += '<span class="course-badge online">Online</span>';
    if (course.has_lab) html += '<span class="course-badge lab">Lab</span>';
    html += '</div>';
    html += '<div class="course-tags">';
    for (const tag of (course.tags || [])) {
      html += '<span class="tag-chip">' + (TAG_LABELS[tag] || tag) + '</span>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderTranscriptItem(course) {
    let html = '<div class="transcript-item">';
    html += '<div class="transcript-name">' + escapeHtml(course.name) + '</div>';
    html += '<div class="transcript-meta">';
    if (course.grade) html += '<span class="transcript-grade">' + course.grade + '</span>';
    if (course.credits) html += '<span class="transcript-credits">' + course.credits + ' cr</span>';
    html += '</div>';
    if (course.tags && course.tags.length > 0) {
      html += '<div class="course-tags">';
      for (const tag of course.tags) {
        html += '<span class="tag-chip">' + (TAG_LABELS[tag] || tag) + '</span>';
      }
      html += '</div>';
    }
    if (course.notes) {
      html += '<div class="transcript-note">' + escapeHtml(course.notes) + '</div>';
    }
    html += '</div>';
    return html;
  }

  function toggleTranscript() {
    transcriptExpanded = !transcriptExpanded;
    renderPanel();
  }

  function showAddForm(semester) {
    editingCourseId = null;
    const form = document.getElementById('add-course-form');
    form.classList.remove('hidden');
    form.innerHTML = buildCourseForm(semester, null);

    // Scroll form into view
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function editCourse(courseId) {
    const course = courseData.courses.find(c => c.id === courseId);
    if (!course) return;

    editingCourseId = courseId;
    const form = document.getElementById('add-course-form');
    form.classList.remove('hidden');
    form.innerHTML = buildCourseForm(course.semester, course);
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function buildCourseForm(semester, existingCourse) {
    const isEdit = existingCourse !== null;
    const name = existingCourse?.name || '';
    const institution = existingCourse?.institution || '';
    const online = existingCourse?.online || false;
    const hasLab = existingCourse?.has_lab || false;
    const credits = existingCourse?.credits || 3;
    const existingTags = existingCourse?.tags || [];

    // Auto-suggest tags from name
    const suggestedTags = name ? suggestTags(name) : [];
    const activeTags = isEdit ? existingTags : suggestedTags;

    let html = '<div class="form-header">';
    html += '<h4>' + (isEdit ? 'Edit Course' : 'Add Course') + '</h4>';
    html += '<button class="btn-icon" onclick="CoursesPanel.cancelForm()">✕</button>';
    html += '</div>';

    html += '<div class="form-field">';
    html += '<label>Course Name</label>';
    html += '<input type="text" id="course-name-input" value="' + escapeHtml(name) + '" placeholder="e.g. Microbiology BIOSCI-197" oninput="CoursesPanel.onNameInput(this.value)">';
    html += '</div>';

    html += '<div class="form-field">';
    html += '<label>Institution</label>';
    html += '<input type="text" id="course-institution-input" value="' + escapeHtml(institution) + '" placeholder="e.g. MATC">';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-field">';
    html += '<label>Semester</label>';
    html += '<select id="course-semester-input">';
    const semesters = courseData.semesters || {};
    for (const [key, sem] of Object.entries(semesters)) {
      const selected = key === semester ? ' selected' : '';
      html += '<option value="' + key + '"' + selected + '>' + escapeHtml(sem.label) + '</option>';
    }
    html += '</select>';
    html += '</div>';

    html += '<div class="form-field">';
    html += '<label>Credits</label>';
    html += '<input type="number" id="course-credits-input" value="' + credits + '" min="1" max="6" style="width:60px;">';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<label class="form-checkbox"><input type="checkbox" id="course-online-input"' + (online ? ' checked' : '') + '> Online</label>';
    html += '<label class="form-checkbox"><input type="checkbox" id="course-lab-input"' + (hasLab ? ' checked' : '') + '> Has Lab</label>';
    html += '</div>';

    // Tag chips
    html += '<div class="form-field">';
    html += '<label>Prereq Tags <span class="form-hint">(click to toggle)</span></label>';
    html += '<div id="tag-chips" class="tag-chips-container">';
    html += renderTagChips(activeTags);
    html += '</div>';
    html += '</div>';

    html += '<div class="form-actions">';
    html += '<button class="btn-save" onclick="CoursesPanel.saveCourse(\'' + semester + '\')">' + (isEdit ? 'Update' : 'Add') + '</button>';
    html += '<button class="btn-cancel" onclick="CoursesPanel.cancelForm()">Cancel</button>';
    html += '</div>';

    return html;
  }

  function renderTagChips(activeTags) {
    let html = '';
    // Show common tags first, then rest
    const commonTags = ['ap1', 'ap2', 'micro', 'stats', 'chem', 'gen_chem_lab', 'lifespan', 'nutrition', 'psych', 'sociology', 'biology', 'ethics'];
    const extendedTags = ALL_TAGS.filter(t => !commonTags.includes(t));

    for (const tag of commonTags) {
      const active = activeTags.includes(tag) ? ' active' : '';
      html += '<span class="tag-chip selectable' + active + '" data-tag="' + tag + '" onclick="CoursesPanel.toggleTag(\'' + tag + '\')">' + (TAG_LABELS[tag] || tag) + '</span>';
    }

    html += '<div class="tag-chips-extended" id="extended-tags">';
    for (const tag of extendedTags) {
      const active = activeTags.includes(tag) ? ' active' : '';
      html += '<span class="tag-chip selectable' + active + '" data-tag="' + tag + '" onclick="CoursesPanel.toggleTag(\'' + tag + '\')">' + (TAG_LABELS[tag] || tag) + '</span>';
    }
    html += '</div>';

    return html;
  }

  function toggleTag(tag) {
    const chip = document.querySelector('.tag-chip.selectable[data-tag="' + tag + '"]');
    if (chip) {
      chip.classList.toggle('active');
    }
  }

  function onNameInput(value) {
    const suggested = suggestTags(value);
    // Auto-activate suggested tags
    document.querySelectorAll('.tag-chip.selectable').forEach(chip => {
      const tag = chip.dataset.tag;
      if (suggested.includes(tag)) {
        chip.classList.add('active');
      }
    });
  }

  function getSelectedTags() {
    const tags = [];
    document.querySelectorAll('.tag-chip.selectable.active').forEach(chip => {
      tags.push(chip.dataset.tag);
    });
    return tags;
  }

  async function saveCourse(defaultSemester) {
    const name = document.getElementById('course-name-input').value.trim();
    const institution = document.getElementById('course-institution-input').value.trim();
    const semester = document.getElementById('course-semester-input').value;
    const credits = parseInt(document.getElementById('course-credits-input').value) || 3;
    const online = document.getElementById('course-online-input').checked;
    const hasLab = document.getElementById('course-lab-input').checked;
    const tags = getSelectedTags();

    if (!name) {
      alert('Course name is required');
      return;
    }

    // Generate ID from name if new
    const id = editingCourseId || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

    const courseObj = {
      id: id,
      name: name,
      institution: institution,
      semester: semester,
      status: 'planned',
      tags: tags,
      online: online,
      has_lab: hasLab,
      credits: credits
    };

    try {
      let response;
      if (editingCourseId) {
        response = await fetch('/api/courses/' + encodeURIComponent(editingCourseId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseObj)
        });
      } else {
        response = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseObj)
        });
      }

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Failed to save course');
        return;
      }

      // Reload and re-render
      await loadCourseData();
      renderPanel();
      cancelForm();

      // Re-evaluate plan fit
      if (typeof reEvaluateAndRender === 'function') {
        reEvaluateAndRender();
      }
    } catch (e) {
      alert('Error saving course: ' + e.message);
    }
  }

  async function deleteCourse(courseId) {
    if (!confirm('Remove this course?')) return;

    try {
      const response = await fetch('/api/courses/' + encodeURIComponent(courseId), {
        method: 'DELETE'
      });

      if (!response.ok && response.status !== 204) {
        alert('Failed to delete course');
        return;
      }

      await loadCourseData();
      renderPanel();

      if (typeof reEvaluateAndRender === 'function') {
        reEvaluateAndRender();
      }
    } catch (e) {
      alert('Error deleting course: ' + e.message);
    }
  }

  function cancelForm() {
    editingCourseId = null;
    const form = document.getElementById('add-course-form');
    if (form) {
      form.classList.add('hidden');
      form.innerHTML = '';
    }
  }

  function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    loadCourseData,
    togglePanel,
    renderPanel,
    toggleTranscript,
    showAddForm,
    editCourse,
    deleteCourse,
    saveCourse,
    cancelForm,
    toggleTag,
    onNameInput,
    getCourseData: function () { return courseData; },
    get panelOpen() { return typeof panelOpen !== 'undefined' ? panelOpen : false; }
  };
})();
