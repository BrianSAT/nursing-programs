/**
 * Plan-Fit Engine
 *
 * Evaluates each program against user's courses in real-time.
 * Replaces hardcoded plan_fit.status + plan_fit.reasons with live computation.
 */

const PlanFitEngine = (function () {

  // Collect all tags the user has (completed + in_progress + planned)
  // Returns { allTags: Set, completedTags: Set, tagsByDate: Map<date, Set>, onlineLabCourses: [] }
  function buildUserProfile(courseData) {
    const allTags = new Set();
    const completedTags = new Set();
    const tagsByDate = new Map(); // end_date -> Set of tags available by that date
    const onlineLabCourses = []; // courses with online=true && has_lab=true
    const allCourses = [...(courseData.courses || []), ...(courseData.transcript || [])];
    const semesters = courseData.semesters || {};

    // Transcript courses are already completed
    for (const course of (courseData.transcript || [])) {
      if (course.tags) {
        course.tags.forEach(t => {
          allTags.add(t);
          completedTags.add(t);
        });
      }
    }

    // Current/planned courses — available by their semester end date
    for (const course of (courseData.courses || [])) {
      if (course.tags) {
        course.tags.forEach(t => allTags.add(t));
      }

      const sem = semesters[course.semester];
      const endDate = sem ? sem.end_date : null;

      if (endDate && course.tags) {
        if (!tagsByDate.has(endDate)) tagsByDate.set(endDate, new Set());
        course.tags.forEach(t => tagsByDate.get(endDate).add(t));
      }

      // Track online lab courses (for online lab policy check)
      if (course.online && course.has_lab) {
        onlineLabCourses.push(course);
      }
    }

    // Count chem courses for chem_sequence check
    const chemCourseCount = allCourses.filter(c =>
      c.tags && c.tags.includes('chem')
    ).length;

    return { allTags, completedTags, tagsByDate, onlineLabCourses, chemCourseCount, semesters };
  }

  // Check if user has tags available by a given date
  function tagsAvailableByDate(profile, targetDate) {
    const available = new Set(profile.completedTags);
    if (!targetDate) return available;

    for (const [endDate, tags] of profile.tagsByDate) {
      if (endDate <= targetDate) {
        tags.forEach(t => available.add(t));
      }
    }
    return available;
  }

  // Check if a single tag is satisfied
  function hasTag(tagSet, tag) {
    return tagSet.has(tag);
  }

  // Check standard prereqs. Returns { satisfied: [], missing: [], warnings: [] }
  function checkStandardPrereqs(program, profile) {
    const standard = program.prerequisites?.standard || {};
    const satisfied = [];
    const missing = [];
    const warnings = [];

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

    for (const [key, required] of Object.entries(standard)) {
      if (!required) continue;

      if (key === 'ap_1_2') {
        // Special: needs both ap1 AND ap2
        const hasAp1 = profile.allTags.has('ap1');
        const hasAp2 = profile.allTags.has('ap2');
        if (hasAp1 && hasAp2) {
          satisfied.push(prereqLabels[key]);
        } else if (hasAp1 || hasAp2) {
          const missingPart = hasAp1 ? 'A&P 2' : 'A&P 1';
          missing.push(missingPart);
        } else {
          missing.push(prereqLabels[key]);
        }
      } else {
        if (profile.allTags.has(key)) {
          satisfied.push(prereqLabels[key]);
        } else {
          missing.push(prereqLabels[key] || key);
        }
      }
    }

    return { satisfied, missing, warnings };
  }

  // Check extra prereqs via prereq-map. Returns { satisfied: [], missing: [], warnings: [], hardBlockers: [] }
  function checkExtraPrereqs(program, profile, prereqMap) {
    const extras = program.prerequisites?.extra || [];
    const mappings = prereqMap?.mappings || {};
    const satisfied = [];
    const missing = [];
    const warnings = [];
    const hardBlockers = [];

    for (const extraStr of extras) {
      const mapping = mappings[extraStr];

      if (!mapping) {
        // Unknown extra prereq — treat as warning
        warnings.push('Unknown requirement: ' + extraStr);
        continue;
      }

      // Skip documents (administrative, not course requirements)
      if (mapping.type === 'document') continue;

      // Hard blockers
      if (mapping.hard_blocker) {
        hardBlockers.push(extraStr);
        continue;
      }

      // Exams — warning only, don't count as missing courses
      if (mapping.type === 'exam') {
        warnings.push('Exam required: ' + extraStr);
        continue;
      }

      // Policy items — warning only
      if (mapping.type === 'policy') {
        if (mapping.notes) warnings.push(mapping.notes);
        continue;
      }

      // Institutional requirements that are taken during program
      if (mapping.type === 'institutional' && mapping.notes && mapping.notes.includes('during program')) {
        continue;
      }

      // Course/certification requirements — check tags
      const tags = mapping.tags || [];
      if (tags.length === 0) {
        // No tags to check (institutional gen-ed satisfied by BA, etc.)
        if (mapping.notes && mapping.notes.includes('satisfied by BA')) continue;
        if (mapping.notes && mapping.notes.includes('Future requirement')) continue;
        continue;
      }

      // Handle OR logic: tags like [["patho", "pharm"]] means patho OR pharm
      if (mapping.logic === 'or') {
        const orGroup = tags[0]; // First element is the OR group array
        if (Array.isArray(orGroup)) {
          const hasSome = orGroup.some(t => profile.allTags.has(t));
          if (hasSome) {
            satisfied.push(extraStr);
          } else {
            missing.push(extraStr);
          }
        } else {
          // Single tag in OR context
          if (profile.allTags.has(orGroup)) {
            satisfied.push(extraStr);
          } else {
            missing.push(extraStr);
          }
        }
      } else {
        // AND logic — all tags must be present
        const allPresent = tags.every(t => {
          if (Array.isArray(t)) {
            // Nested OR within AND
            return t.some(sub => profile.allTags.has(sub));
          }
          // Special: chem_sequence needs 2 chem courses
          if (t === 'chem_sequence') {
            return profile.chemCourseCount >= 2;
          }
          return profile.allTags.has(t);
        });

        if (allPresent) {
          satisfied.push(extraStr);
        } else {
          missing.push(extraStr);
        }
      }
    }

    return { satisfied, missing, warnings, hardBlockers };
  }

  // Check online lab policy
  function checkOnlineLabPolicy(program, profile) {
    const warnings = [];
    let ruledOut = false;

    const onlineLabConf = program.program_details?.online_lab_conf;
    const hasOnlineLabs = profile.onlineLabCourses.length > 0;

    if (!hasOnlineLabs) return { warnings, ruledOut };

    // online_lab_conf: 0 = definitely rejects, 1 = definitely accepts, null = unknown
    if (onlineLabConf !== null && onlineLabConf !== undefined && onlineLabConf <= 0.1) {
      // Program rejects online labs — per user preference, rule out
      ruledOut = true;
      warnings.push('Does NOT accept online A&P labs — requires in-person lab completion');
    } else if (onlineLabConf === null || onlineLabConf === undefined) {
      warnings.push('Online A&P lab policy unclear — verify with school before applying');
    } else if (onlineLabConf < 0.5) {
      warnings.push('Online A&P labs may not be accepted (low confidence: ' + Math.round(onlineLabConf * 100) + '%)');
    }

    return { warnings, ruledOut };
  }

  // Check if deadline has passed
  function isDeadlinePassed(program) {
    const deadline = program.admissions?.deadline;
    if (!deadline) return false;

    // Compare with today
    const today = new Date().toISOString().split('T')[0];
    return deadline < today;
  }

  // Check if prereqs must be complete at application and user won't have them done
  function checkInProgressPolicy(program, profile) {
    const inProgressOk = program.admissions?.in_progress_ok;
    if (inProgressOk !== false) return { blocked: false, reason: null };

    // Check if all required standard prereqs are already completed (not just planned)
    const standard = program.prerequisites?.standard || {};
    for (const [key, required] of Object.entries(standard)) {
      if (!required) continue;
      if (key === 'ap_1_2') {
        if (!profile.completedTags.has('ap1') || !profile.completedTags.has('ap2')) {
          return {
            blocked: true,
            reason: 'Requires complete prereqs at application — you will have courses in-progress'
          };
        }
      } else {
        if (!profile.completedTags.has(key)) {
          return {
            blocked: true,
            reason: 'Requires complete prereqs at application — you will have courses in-progress'
          };
        }
      }
    }

    return { blocked: false, reason: null };
  }

  // Determine which missing courses could be taken in Fall 2026
  function getMissingForFall(missingCourses) {
    // All missing courses are potentially takeable in fall
    // This is a simplification — in reality would need to check availability
    return missingCourses;
  }

  // Check if program is confirmed not accepting applications
  function isNotAccepting(program) {
    const notes = (program.verification?.notes || '').toUpperCase();
    return notes.includes('NOT ACCEPTING') || notes.includes('NOT CURRENTLY ACCEPTING');
  }

  // Main evaluation: evaluate a single program
  function evaluateProgram(program, profile, prereqMap) {
    const reasons = [];
    const warnings = [];
    let status = 'fits';

    // 0. Hard blocker: program confirmed not accepting applications
    if (isNotAccepting(program)) {
      return {
        status: 'ruled_out',
        reasons: ['Not currently accepting applications'],
        warnings: []
      };
    }

    // 1. Hard blocker: deadline passed
    if (isDeadlinePassed(program)) {
      const deadline = program.admissions?.deadline;
      return {
        status: 'ruled_out',
        reasons: ['Application deadline passed (' + formatDateShort(deadline) + ')'],
        warnings: []
      };
    }

    // 2. Hard blocker: in_progress_ok = false and prereqs incomplete
    const inProgressCheck = checkInProgressPolicy(program, profile);
    if (inProgressCheck.blocked) {
      return {
        status: 'ruled_out',
        reasons: [inProgressCheck.reason],
        warnings: []
      };
    }

    // 3. Extra prereqs check (do first to catch hard blockers)
    const extraResult = checkExtraPrereqs(program, profile, prereqMap);
    warnings.push(...extraResult.warnings);

    // Hard blockers from extra prereqs (CNA, healthcare exp, residency)
    if (extraResult.hardBlockers.length > 0) {
      return {
        status: 'ruled_out',
        reasons: ['Requires: ' + extraResult.hardBlockers.join(', ')],
        warnings: extraResult.warnings
      };
    }

    // 4. Online lab check
    const onlineLabResult = checkOnlineLabPolicy(program, profile);
    warnings.push(...onlineLabResult.warnings);
    if (onlineLabResult.ruledOut) {
      return {
        status: 'ruled_out',
        reasons: [onlineLabResult.warnings[0]],
        warnings: onlineLabResult.warnings.slice(1)
      };
    }

    // 5. Standard prereq check
    const standardResult = checkStandardPrereqs(program, profile);
    warnings.push(...standardResult.warnings);

    // 6. Combine all missing
    const allMissing = [...standardResult.missing, ...extraResult.missing];

    // 7. Status determination
    if (allMissing.length === 0) {
      status = 'fits';
      if (warnings.length > 0 && warnings.some(w => w.includes('Online A&P lab'))) {
        reasons.push(warnings.find(w => w.includes('Online A&P lab')));
      } else {
        reasons.push('Standard prereqs match your plan');
      }
    } else if (allMissing.length <= 3) {
      status = 'fall_required';
      reasons.push('Fall 2026 courses needed (' + allMissing.length + '): ' + allMissing.join(', '));

      // Add online lab warning if present
      const onlineLabWarning = warnings.find(w => w.includes('Online A&P lab'));
      if (onlineLabWarning) reasons.push(onlineLabWarning);
    } else {
      status = 'adjust';
      reasons.push('Needs ' + allMissing.length + ' extra courses: ' + allMissing.join(', '));
      reasons.push('More than 3 courses — may need summer additions or test-outs');
    }

    return { status, reasons, warnings };
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Main entry point: evaluate ALL programs
  function evaluateAll(programs, courseData, prereqMap) {
    const profile = buildUserProfile(courseData);
    const results = {};

    for (const program of programs) {
      results[program.id] = evaluateProgram(program, profile, prereqMap);
    }

    return results;
  }

  return { evaluateAll, buildUserProfile, evaluateProgram };
})();
