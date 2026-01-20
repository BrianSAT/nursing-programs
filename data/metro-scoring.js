/**
 * Metro Scoring System
 * Combines location rubric + NP pathway factors
 *
 * Location Score (10 points max):
 * - Distance from Milwaukee (3 points)
 * - Geography (3 points)
 * - City Size/Culture (4 points)
 *
 * NP Pathway Score (0-1):
 * - ED Opportunity (35%): Trauma center density
 * - NP Accessibility (40%): Part-time/hybrid NP programs
 * - Underserved Access (25%): HPSAs, FQHCs
 *
 * Combined Metro Score = Location Score × NP Pathway Score
 */

const fs = require('fs');
const path = require('path');

// Metros to score (excluding ones we already have programs in)
const METROS_TO_SCORE = [
  // Top 50 by population (not already covered)
  { name: "San Francisco, CA", population: 4700000, driveHours: 30, hasAirport: true, geography: "bay+hills", metro: "large" },
  { name: "San Diego, CA", population: 3300000, driveHours: 28, hasAirport: true, geography: "coast+hills", metro: "large" },
  { name: "San Jose, CA", population: 2000000, driveHours: 30, hasAirport: true, geography: "valley+mountains", metro: "large" },
  { name: "Sacramento, CA", population: 2400000, driveHours: 28, hasAirport: true, geography: "valley+river", metro: "large" },
  { name: "San Antonio, TX", population: 2600000, driveHours: 18, hasAirport: true, geography: "hill_country", metro: "large" },
  { name: "Austin, TX", population: 2400000, driveHours: 17, hasAirport: true, geography: "hill_country+river", metro: "large" },
  { name: "Tampa, FL", population: 3300000, driveHours: 18, hasAirport: true, geography: "coast", metro: "large" },
  { name: "Orlando, FL", population: 2700000, driveHours: 18, hasAirport: true, geography: "flat+lakes", metro: "large" },
  { name: "Miami, FL", population: 6200000, driveHours: 22, hasAirport: true, geography: "coast", metro: "large" },
  { name: "Jacksonville, FL", population: 1600000, driveHours: 16, hasAirport: true, geography: "coast+river", metro: "medium" },
  { name: "Indianapolis, IN", population: 2100000, driveHours: 4, hasAirport: true, geography: "flat+river", metro: "large" },
  { name: "Charlotte, NC", population: 2800000, driveHours: 11, hasAirport: true, geography: "piedmont+mountains_near", metro: "large" },
  { name: "Raleigh, NC", population: 1500000, driveHours: 13, hasAirport: true, geography: "piedmont", metro: "medium" },
  { name: "Virginia Beach, VA", population: 1800000, driveHours: 14, hasAirport: true, geography: "coast", metro: "large" },
  { name: "Washington, DC", population: 6400000, driveHours: 12, hasAirport: true, geography: "river+piedmont", metro: "large" },
  { name: "Detroit, MI", population: 4400000, driveHours: 6, hasAirport: true, geography: "river+lakes", metro: "large" },
  { name: "Cleveland, OH", population: 2100000, driveHours: 6, hasAirport: true, geography: "lake+river", metro: "large" },
  { name: "Portland, OR", population: 2500000, driveHours: 32, hasAirport: true, geography: "river+mountains", metro: "large" },
  { name: "Las Vegas, NV", population: 2300000, driveHours: 26, hasAirport: true, geography: "desert+mountains", metro: "large" },
  { name: "Salt Lake City, UT", population: 1300000, driveHours: 20, hasAirport: true, geography: "mountains+lake", metro: "medium" },
  { name: "Kansas City, MO", population: 2200000, driveHours: 8, hasAirport: true, geography: "river+plains", metro: "large" },
  { name: "St. Louis, MO", population: 2800000, driveHours: 5, hasAirport: true, geography: "river+bluffs", metro: "large" },
  { name: "Memphis, TN", population: 1400000, driveHours: 9, hasAirport: true, geography: "river+bluffs", metro: "medium" },
  { name: "Louisville, KY", population: 1400000, driveHours: 5, hasAirport: true, geography: "river+hills", metro: "medium" },
  { name: "Richmond, VA", population: 1350000, driveHours: 13, hasAirport: true, geography: "river+piedmont", metro: "medium" },
  { name: "Hartford, CT", population: 1200000, driveHours: 14, hasAirport: false, geography: "river+hills", metro: "medium" },
  { name: "Buffalo, NY", population: 1200000, driveHours: 8, hasAirport: true, geography: "lake+river", metro: "medium" },
  { name: "Birmingham, AL", population: 1150000, driveHours: 10, hasAirport: true, geography: "mountains+river", metro: "medium" },
  { name: "New Orleans, LA", population: 1300000, driveHours: 14, hasAirport: true, geography: "river+coast", metro: "medium" },
  { name: "Oklahoma City, OK", population: 1450000, driveHours: 13, hasAirport: true, geography: "plains+river", metro: "medium" },
  { name: "Tucson, AZ", population: 1050000, driveHours: 24, hasAirport: true, geography: "desert+mountains", metro: "medium" },
  { name: "Albuquerque, NM", population: 950000, driveHours: 20, hasAirport: true, geography: "desert+mountains+river", metro: "medium" },
  { name: "Honolulu, HI", population: 1000000, driveHours: 99, hasAirport: true, geography: "island+mountains", metro: "medium" },
  // Additional metros in the 51-100 range
  { name: "Providence, RI", population: 1650000, driveHours: 15, hasAirport: true, geography: "coast+bay", metro: "large" },
  { name: "Milwaukee, WI", population: 1600000, driveHours: 0, hasAirport: true, geography: "lake", metro: "large" },
  { name: "Jacksonville, FL", population: 1600000, driveHours: 16, hasAirport: true, geography: "coast+river", metro: "large" },
  { name: "Greenville, SC", population: 950000, driveHours: 11, hasAirport: true, geography: "mountains+river", metro: "medium" },
  { name: "Chattanooga, TN", population: 600000, driveHours: 8, hasAirport: false, geography: "mountains+river", metro: "small" },
  { name: "Asheville, NC", population: 480000, driveHours: 10, hasAirport: true, geography: "mountains", metro: "small" },
  { name: "Boise, ID", population: 800000, driveHours: 26, hasAirport: true, geography: "mountains+river", metro: "medium" },
  { name: "Colorado Springs, CO", population: 750000, driveHours: 15, hasAirport: true, geography: "mountains", metro: "medium" },
  { name: "Spokane, WA", population: 600000, driveHours: 28, hasAirport: true, geography: "river+mountains", metro: "small" },
  { name: "Little Rock, AR", population: 750000, driveHours: 10, hasAirport: true, geography: "river+hills", metro: "medium" },
  { name: "Tulsa, OK", population: 1000000, driveHours: 11, hasAirport: true, geography: "river+hills", metro: "medium" },
  { name: "Grand Rapids, MI", population: 1100000, driveHours: 3, hasAirport: true, geography: "river+dunes", metro: "medium" },
  { name: "Dayton, OH", population: 850000, driveHours: 5, hasAirport: true, geography: "river+hills", metro: "medium" },
  { name: "Akron, OH", population: 700000, driveHours: 6, hasAirport: false, geography: "hills", metro: "medium" },
  { name: "Syracuse, NY", population: 650000, driveHours: 10, hasAirport: true, geography: "lake+hills", metro: "small" },
  { name: "Worcester, MA", population: 950000, driveHours: 14, hasAirport: false, geography: "hills", metro: "medium" },
];

// Scoring functions
function scoreDistance(driveHours, hasAirport) {
  if (driveHours >= 4 && driveHours <= 8 && hasAirport) return 3.0;
  if (driveHours >= 1 && driveHours <= 4) return 2.5;
  if ((driveHours >= 4 && driveHours <= 8 && !hasAirport) || (driveHours > 8 && hasAirport)) return 2.0;
  if (driveHours < 1 || (driveHours >= 8 && driveHours <= 12 && !hasAirport)) return 1.0;
  if (driveHours > 12 && !hasAirport) return 0.0;
  return 2.0; // default for >8hr with airport
}

function scoreGeography(geography) {
  if (geography.includes('river') && (geography.includes('mountain') || geography.includes('hill') || geography.includes('bluff'))) return 3.0;
  if (geography.includes('mountain') || geography.includes('lake')) return 2.0;
  if (geography.includes('hill') || geography.includes('hiking') || geography.includes('coast')) return 1.5;
  if (geography.includes('river') || geography.includes('piedmont')) return 1.0;
  return 0.5;
}

function scoreCitySize(metro, isOnTheComeUp = false) {
  const onTheComeUp = ['Austin, TX', 'Nashville, TN', 'Raleigh, NC', 'Denver, CO', 'Pittsburgh, PA', 'Boise, ID', 'Chattanooga, TN', 'Asheville, NC', 'Salt Lake City, UT', 'Charlotte, NC', 'Greenville, SC'];

  if (metro === 'medium' && isOnTheComeUp) return 4.0;
  if (metro === 'large') return 3.5;
  if (metro === 'small' && isOnTheComeUp) return 2.5;
  if (metro === 'medium') return 3.0;
  return 1.0;
}

// NP Pathway estimates (would need real research to verify)
const NP_PATHWAY_ESTIMATES = {
  'San Francisco, CA': { ed: 0.90, np: 0.85, underserved: 0.85 },
  'San Diego, CA': { ed: 0.80, np: 0.80, underserved: 0.75 },
  'San Jose, CA': { ed: 0.70, np: 0.75, underserved: 0.70 },
  'Sacramento, CA': { ed: 0.75, np: 0.75, underserved: 0.80 },
  'San Antonio, TX': { ed: 0.85, np: 0.85, underserved: 0.90 },
  'Austin, TX': { ed: 0.80, np: 0.85, underserved: 0.70 },
  'Tampa, FL': { ed: 0.80, np: 0.80, underserved: 0.75 },
  'Orlando, FL': { ed: 0.75, np: 0.75, underserved: 0.70 },
  'Miami, FL': { ed: 0.90, np: 0.80, underserved: 0.90 },
  'Jacksonville, FL': { ed: 0.75, np: 0.70, underserved: 0.75 },
  'Indianapolis, IN': { ed: 0.80, np: 0.80, underserved: 0.80 },
  'Charlotte, NC': { ed: 0.85, np: 0.80, underserved: 0.75 },
  'Raleigh, NC': { ed: 0.75, np: 0.85, underserved: 0.70 },
  'Virginia Beach, VA': { ed: 0.70, np: 0.70, underserved: 0.65 },
  'Washington, DC': { ed: 0.90, np: 0.90, underserved: 0.85 },
  'Detroit, MI': { ed: 0.85, np: 0.80, underserved: 0.90 },
  'Cleveland, OH': { ed: 0.85, np: 0.85, underserved: 0.85 },
  'Portland, OR': { ed: 0.80, np: 0.85, underserved: 0.80 },
  'Las Vegas, NV': { ed: 0.75, np: 0.70, underserved: 0.80 },
  'Salt Lake City, UT': { ed: 0.80, np: 0.80, underserved: 0.75 },
  'Kansas City, MO': { ed: 0.80, np: 0.80, underserved: 0.80 },
  'St. Louis, MO': { ed: 0.90, np: 0.85, underserved: 0.90 },
  'Memphis, TN': { ed: 0.85, np: 0.75, underserved: 0.95 },
  'Louisville, KY': { ed: 0.80, np: 0.80, underserved: 0.85 },
  'Richmond, VA': { ed: 0.80, np: 0.80, underserved: 0.75 },
  'Hartford, CT': { ed: 0.75, np: 0.80, underserved: 0.70 },
  'Buffalo, NY': { ed: 0.75, np: 0.75, underserved: 0.80 },
  'Birmingham, AL': { ed: 0.85, np: 0.80, underserved: 0.90 },
  'New Orleans, LA': { ed: 0.80, np: 0.75, underserved: 0.90 },
  'Oklahoma City, OK': { ed: 0.75, np: 0.75, underserved: 0.85 },
  'Tucson, AZ': { ed: 0.75, np: 0.80, underserved: 0.90 },
  'Albuquerque, NM': { ed: 0.75, np: 0.80, underserved: 0.95 },
  'Honolulu, HI': { ed: 0.70, np: 0.65, underserved: 0.70 },
  'Providence, RI': { ed: 0.80, np: 0.85, underserved: 0.75 },
  'Greenville, SC': { ed: 0.75, np: 0.75, underserved: 0.80 },
  'Chattanooga, TN': { ed: 0.70, np: 0.70, underserved: 0.85 },
  'Asheville, NC': { ed: 0.65, np: 0.70, underserved: 0.80 },
  'Boise, ID': { ed: 0.70, np: 0.70, underserved: 0.75 },
  'Colorado Springs, CO': { ed: 0.75, np: 0.75, underserved: 0.70 },
  'Spokane, WA': { ed: 0.65, np: 0.70, underserved: 0.80 },
  'Little Rock, AR': { ed: 0.75, np: 0.75, underserved: 0.90 },
  'Tulsa, OK': { ed: 0.75, np: 0.75, underserved: 0.85 },
  'Grand Rapids, MI': { ed: 0.70, np: 0.75, underserved: 0.75 },
  'Dayton, OH': { ed: 0.70, np: 0.75, underserved: 0.80 },
  'Akron, OH': { ed: 0.65, np: 0.70, underserved: 0.75 },
  'Syracuse, NY': { ed: 0.70, np: 0.75, underserved: 0.75 },
  'Worcester, MA': { ed: 0.70, np: 0.80, underserved: 0.70 },
};

const ON_THE_COME_UP = ['Austin, TX', 'Raleigh, NC', 'Boise, ID', 'Chattanooga, TN', 'Asheville, NC', 'Salt Lake City, UT', 'Charlotte, NC', 'Greenville, SC', 'Colorado Springs, CO'];

// States with full NP practice authority (no physician supervision required)
const FULL_NP_PRACTICE_AUTHORITY_STATES = ['AZ', 'CO', 'CT', 'DC', 'HI', 'ID', 'IA', 'ME', 'MD', 'MN', 'MT', 'NE', 'NV', 'NH', 'NM', 'ND', 'OR', 'RI', 'SD', 'VT', 'WA', 'WY'];

// Cities known for food scene
const FOOD_CITIES = ['New Orleans, LA', 'Austin, TX', 'Portland, OR', 'San Francisco, CA', 'Memphis, TN', 'Louisville, KY', 'Charleston, SC', 'Asheville, NC', 'Nashville, TN', 'Kansas City, MO', 'Chicago, IL', 'Miami, FL', 'San Diego, CA'];

// Cities known for live music scene
const MUSIC_CITIES = ['Austin, TX', 'Nashville, TN', 'New Orleans, LA', 'Memphis, TN', 'Portland, OR', 'Seattle, WA', 'Cleveland, OH', 'Detroit, MI', 'Chicago, IL', 'San Francisco, CA', 'Kansas City, MO', 'Minneapolis, MN'];

// Cities conducive to dating (high % young professionals 25-35, high transplant rate, vibrant social scene)
// Metrics: young adult % of population, growth rate (transplant indicator), walkability, social venues
const DATING_FRIENDLY = ['Austin, TX', 'Denver, CO', 'Washington, DC', 'Charlotte, NC', 'Raleigh, NC', 'Nashville, TN', 'Portland, OR', 'Seattle, WA', 'Minneapolis, MN', 'San Diego, CA', 'Tampa, FL', 'Salt Lake City, UT', 'Columbus, OH', 'Indianapolis, IN', 'Kansas City, MO', 'Boise, ID', 'Colorado Springs, CO'];

function getStateAbbrev(metroName) {
  const match = metroName.match(/, ([A-Z]{2})$/);
  return match ? match[1] : null;
}

// Calculate scores
const results = METROS_TO_SCORE.map(metro => {
  const distScore = scoreDistance(metro.driveHours, metro.hasAirport);
  const geoScore = scoreGeography(metro.geography);
  const isOnTheComeUp = ON_THE_COME_UP.includes(metro.name);
  const cityScore = scoreCitySize(metro.metro, isOnTheComeUp);
  const locationScore = distScore + geoScore + cityScore;

  const np = NP_PATHWAY_ESTIMATES[metro.name] || { ed: 0.70, np: 0.70, underserved: 0.70 };
  const npPathway = 0.35 * np.ed + 0.40 * np.np + 0.25 * np.underserved;

  // Calculate bonuses
  const stateAbbrev = getStateAbbrev(metro.name);
  const npPracticeBonus = FULL_NP_PRACTICE_AUTHORITY_STATES.includes(stateAbbrev) ? 0.5 : 0;
  const onTheComeUpBonus = isOnTheComeUp ? 0.5 : 0;
  const foodBonus = FOOD_CITIES.includes(metro.name) ? 0.25 : 0;
  const musicBonus = MUSIC_CITIES.includes(metro.name) ? 0.25 : 0;
  const datingBonus = DATING_FRIENDLY.includes(metro.name) ? 0.25 : 0;

  const totalBonus = npPracticeBonus + onTheComeUpBonus + foodBonus + musicBonus + datingBonus;
  const combinedScore = (locationScore + totalBonus) * npPathway;

  return {
    name: metro.name,
    population: metro.population,
    locationScore: Math.round(locationScore * 100) / 100,
    distScore,
    geoScore,
    cityScore,
    npPathway: Math.round(npPathway * 100) / 100,
    bonuses: {
      npPractice: npPracticeBonus,
      onTheComeUp: onTheComeUpBonus,
      food: foodBonus,
      music: musicBonus,
      dating: datingBonus,
      total: totalBonus
    },
    combinedScore: Math.round(combinedScore * 100) / 100,
    isOnTheComeUp
  };
}).sort((a, b) => b.combinedScore - a.combinedScore);

// Output top 25
console.log('\n=== TOP 25 METROS FOR NURSING PROGRAM ===\n');
console.log('Rank | Metro'.padEnd(35) + 'Loc  | Bonus | NP  | Combined');
console.log('='.repeat(75));
results.slice(0, 25).forEach((r, i) => {
  const flags = [];
  if (r.bonuses.npPractice > 0) flags.push('NP');
  if (r.bonuses.onTheComeUp > 0) flags.push('Up');
  if (r.bonuses.food > 0) flags.push('F');
  if (r.bonuses.music > 0) flags.push('M');
  if (r.bonuses.dating > 0) flags.push('D');
  const flagStr = flags.join('') || '-';
  console.log(
    `#${(i+1).toString().padStart(2)} | ${r.name.padEnd(28)} ${r.locationScore.toFixed(1).padStart(5)} | ${('+'+r.bonuses.total.toFixed(1)).padStart(5)} | ${r.npPathway.toFixed(2).padStart(4)} | ${r.combinedScore.toFixed(2).padStart(6)}  [${flagStr}]`
  );
});

console.log('\nBonus Legend: NP=Full Practice Authority, Up=On-the-Come-Up, F=Food, M=Music, D=Dating\n');

// Save to JSON
const outputPath = path.join(__dirname, 'metro-scores.json');
fs.writeFileSync(outputPath, JSON.stringify({
  methodology: {
    location_max: 10,
    distance_max: 3,
    geography_max: 3,
    city_culture_max: 4,
    np_pathway_formula: "0.35 × ed_opportunity + 0.40 × np_accessibility + 0.25 × underserved_access",
    bonuses: {
      np_practice_authority: "+0.5 for states with full NP practice authority",
      on_the_come_up: "+0.5 for emerging cities with growth momentum",
      food_scene: "+0.25 for cities known for food culture",
      music_scene: "+0.25 for cities known for live music",
      dating_friendly: "+0.25 for cities with high young professional %, transplant rate, social scene"
    }
  },
  metros: results
}, null, 2));

console.log(`Saved ${results.length} metro scores to ${outputPath}`);
