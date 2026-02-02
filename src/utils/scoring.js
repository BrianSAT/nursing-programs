/**
 * Scoring algorithm for nursing program evaluation
 *
 * GOAL: Find the best ABSN program for transitioning to become a triage nurse
 * in an under-resourced healthcare system.
 *
 * PATHWAY: BSN → RN work (ED/triage experience) → NP program (while working) → Triage NP
 *
 * Formula: raw_score = (location_score + location_boost) × prereq_fit × online_lab_conf
 *          × np_pathway × prestige × competitiveness × start_score × time_factor × cost_score
 *
 * KEY SCORING CONCEPTS:
 *
 * - location_score (0-9.5+): Auto-calculated by data/metro-scoring.js (v2 rubric)
 *   Components: distance(3) + geography(2.5) + desirability(3) + bonuses(1) + manual_bonus
 *   Desirability = cool_factor(0-2) + size_preference(0-1)
 *   Bonuses = food(0.25) + events(0.25) + dating(0.25) + student_vibe(0.25)
 *   Manual: user overrides (e.g. Pittsburgh +1) and regional penalties (FL -0.5, Deep South -0.25)
 *
 * - location_boost (0-0.5): NP practice authority only (+0.5 for full NP states)
 *
 * - competitiveness: Peaks at 80th percentile. Being TOO elite (100th) is penalized
 *   equally to being too easy (60th). Formula: 1 - |national_percentile - 0.8|
 *
 * - prestige: Higher is better. Measures downstream career value of the degree.
 *   (Different from competitiveness - ideal is high prestige + 80th percentile difficulty)
 *
 * - np_pathway: Regional viability score for the BSN → NP transition.
 *   Formula: 0.35 × ed_opportunity + 0.40 × np_accessibility + 0.25 × underserved_access
 *   Where:
 *     - ed_opportunity: Availability of ED/trauma jobs for RN experience (0-1)
 *     - np_accessibility: Part-time/hybrid NP programs in region for working nurses (0-1)
 *     - underserved_access: Proximity to underserved populations / HPSAs / FQHCs (0-1)
 *
 * - cost_score: Monthly burn rate normalized. Programs over $10K/month score 0.
 *
 * WORKFLOW: Edit metro-scoring.js → node metro-scoring.js → node sync-programs.js
 */

const DEFAULT_WEIGHTS = {
  prereq_fit: 1.0,
  online_lab_confidence: 1.0,
  np_pathway: 1.0,
  prestige: 1.0,
  competitiveness: 1.0,
  start_score: 1.0,
  time_factor: 1.0,
  cost_score: 1.0
};

const NP_PATHWAY_WEIGHTS = {
  ed_opportunity: 0.35,      // Can you get relevant RN experience in the region?
  np_accessibility: 0.40,    // Are there part-time/hybrid NP programs for working nurses?
  underserved_access: 0.25   // Is there underserved population access nearby?
};

const DEFAULT_METADATA = {
  target_start: '2027-01-20',
  target_competitiveness_percentile: 0.8,
  base_monthly_living: 1500,
  weights: DEFAULT_WEIGHTS,
  np_pathway_weights: NP_PATHWAY_WEIGHTS
};

/**
 * Calculate competitiveness score (peaks at target percentile)
 */
function calcCompetitiveness(nationalPercentile, targetPercentile = 0.8) {
  if (nationalPercentile === null || nationalPercentile === undefined) return 1.0;
  return 1 - Math.abs(nationalPercentile - targetPercentile);
}

/**
 * Calculate start score based on target date
 */
function calcStartScore(startDate, targetDate = '2027-01-20') {
  if (!startDate) return 1.0;

  const start = new Date(startDate);
  const target = new Date(targetDate);
  const diffMonths = (start - target) / (1000 * 60 * 60 * 24 * 30);

  // Penalty for being too early or too late
  if (diffMonths < -6) return 0.5;  // More than 6 months early
  if (diffMonths > 6) return 0.5;   // More than 6 months late
  if (diffMonths < -3) return 0.75; // 3-6 months early
  if (diffMonths > 3) return 0.75;  // 3-6 months late
  return 1.0; // Within 3 months of target
}

/**
 * Calculate time factor based on program duration
 */
function calcTimeFactor(durationMonths) {
  if (!durationMonths) return 1.0;
  if (durationMonths <= 12) return 1.0;
  if (durationMonths <= 18) return 0.75;
  if (durationMonths <= 24) return 0.5;
  return 0.25;
}

/**
 * Calculate monthly burn rate
 */
function calcMonthlyBurn(program, baseMonthlyLiving = 1500) {
  const costs = program.costs || {};
  const details = program.program_details || {};

  const tuition = costs.tuition || 0;
  const fees = costs.fees || 0;
  const scholarships = costs.scholarship_amount || 0;
  const netTuition = tuition + fees - scholarships;

  const duration = details.duration_months || 12;
  const colIndex = costs.cost_of_living_index || 1.0;
  const totalLiving = baseMonthlyLiving * colIndex * duration;

  return (netTuition + totalLiving) / duration;
}

/**
 * Calculate cost score (normalized, lower is better)
 */
function calcCostScore(monthlyBurn, maxBurn = 10000) {
  if (!monthlyBurn) return 1.0;
  // Normalize so lower cost = higher score
  return Math.max(0, 1 - (monthlyBurn / maxBurn));
}

/**
 * Calculate NP pathway score based on regional factors
 *
 * Measures how well the program's region supports the transition:
 * BSN → RN work (gaining ED experience) → NP program (while working) → Triage NP
 *
 * @param {object} regionalData - Object with ed_opportunity, np_accessibility, underserved_access (each 0-1)
 * @param {object} weights - Optional custom weights (default: 0.35, 0.40, 0.25)
 * @returns {number} NP pathway score (0-1)
 */
function calcNpPathway(regionalData, weights = NP_PATHWAY_WEIGHTS) {
  if (!regionalData) return 1.0; // Default if no regional data

  const ed = regionalData.ed_opportunity ?? 0.5;
  const np = regionalData.np_accessibility ?? 0.5;
  const underserved = regionalData.underserved_access ?? 0.5;

  // Weighted average formula
  return (weights.ed_opportunity * ed) +
         (weights.np_accessibility * np) +
         (weights.underserved_access * underserved);
}

/**
 * Calculate all scores for a program
 */
function calculateScores(program, metadata = {}) {
  const meta = { ...DEFAULT_METADATA, ...metadata };
  const weights = { ...DEFAULT_WEIGHTS, ...meta.weights };
  const scores = program.scores || {};
  const details = program.program_details || {};

  // Base scores from manual input
  const locationScore = scores.location || 5;
  const locationBoost = scores.location_boost || 0;
  const prereqFit = scores.prereq_fit || 1.0;
  const onlineLabConf = scores.online_lab_confidence || 1.0;
  const npPathway = scores.np_pathway || 1.0;
  const prestige = scores.prestige || 1.0;

  // Calculated scores
  const competitiveness = calcCompetitiveness(
    scores.national_percentile,
    meta.target_competitiveness_percentile
  );

  const startScore = calcStartScore(
    program.admissions?.start_date,
    meta.target_start
  );

  const timeFactor = calcTimeFactor(details.duration_months);

  const monthlyBurn = calcMonthlyBurn(program, meta.base_monthly_living);
  const costScore = calcCostScore(monthlyBurn);

  // Final raw score calculation
  const rawScore = (locationScore + locationBoost)
    * Math.pow(prereqFit, weights.prereq_fit)
    * Math.pow(onlineLabConf, weights.online_lab_confidence)
    * Math.pow(npPathway, weights.np_pathway)
    * Math.pow(prestige, weights.prestige)
    * Math.pow(competitiveness, weights.competitiveness)
    * Math.pow(startScore, weights.start_score)
    * Math.pow(timeFactor, weights.time_factor)
    * Math.pow(costScore, weights.cost_score);

  return {
    raw_score: Math.round(rawScore * 100) / 100,
    competitiveness: Math.round(competitiveness * 100) / 100,
    start_score: Math.round(startScore * 100) / 100,
    time_factor: timeFactor,
    monthly_burn: Math.round(monthlyBurn),
    cost_score: Math.round(costScore * 100) / 100
  };
}

module.exports = {
  calculateScores,
  calcCompetitiveness,
  calcStartScore,
  calcTimeFactor,
  calcMonthlyBurn,
  calcCostScore,
  calcNpPathway,
  DEFAULT_WEIGHTS,
  DEFAULT_METADATA,
  NP_PATHWAY_WEIGHTS
};
