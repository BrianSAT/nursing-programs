/**
 * Scoring algorithm for nursing program evaluation
 *
 * Formula: raw_score = (location_score + location_boost) × prereq_fit^w × online_lab_conf^w
 *          × np_pathway^w × prestige^w × competitiveness^w × start_score^w
 *          × time_factor^w × cost_score^w
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

const DEFAULT_METADATA = {
  target_start: '2027-01-20',
  target_competitiveness_percentile: 0.8,
  base_monthly_living: 1500,
  weights: DEFAULT_WEIGHTS
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
  DEFAULT_WEIGHTS,
  DEFAULT_METADATA
};
