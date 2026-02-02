/**
 * Metro Scoring System — v2 (Location Rubric Rework)
 *
 * Location Score (9.5 base max, +0.5 NP practice = 10):
 * - Distance from Milwaukee (3 points)
 * - Geography (2.5 points) — outdoor/natural appeal
 * - Desirability (3 points) — cool_factor (0-2) + size_pref (0-1)
 * - Bonuses (1 point) — food(0.25) + events(0.25) + dating(0.25) + studentVibe(0.25)
 *
 * location_boost = npPractice only (+0.5 for full NP practice authority states)
 *
 * NP Pathway Score (0-1):
 * - ED Opportunity (35%): Trauma center density
 * - NP Accessibility (40%): Part-time/hybrid NP programs
 * - Underserved Access (25%): HPSAs, FQHCs
 *
 * Combined Metro Score = (Location Score + location_boost) × NP Pathway Score
 */

const fs = require('fs');
const path = require('path');

// ─── METROS TO SCORE ────────────────────────────────────────────────
const METROS_TO_SCORE = [
  // Top 50 by population
  { name: "San Francisco, CA", population: 4700000, driveHours: 30, hasAirport: true, geography: "bay+hills" },
  { name: "San Diego, CA", population: 3300000, driveHours: 28, hasAirport: true, geography: "coast+hills" },
  { name: "San Jose, CA", population: 2000000, driveHours: 30, hasAirport: true, geography: "valley+mountains" },
  { name: "Sacramento, CA", population: 2400000, driveHours: 28, hasAirport: true, geography: "valley+river" },
  { name: "San Antonio, TX", population: 2600000, driveHours: 18, hasAirport: true, geography: "hill_country" },
  { name: "Austin, TX", population: 2400000, driveHours: 17, hasAirport: true, geography: "hill_country+river" },
  { name: "Tampa, FL", population: 3300000, driveHours: 18, hasAirport: true, geography: "coast" },
  { name: "Orlando, FL", population: 2700000, driveHours: 18, hasAirport: true, geography: "flat+lakes" },
  { name: "Miami, FL", population: 6200000, driveHours: 22, hasAirport: true, geography: "coast" },
  { name: "Jacksonville, FL", population: 1600000, driveHours: 16, hasAirport: true, geography: "coast+river" },
  { name: "Indianapolis, IN", population: 2100000, driveHours: 4, hasAirport: true, geography: "flat+river" },
  { name: "Charlotte, NC", population: 2800000, driveHours: 11, hasAirport: true, geography: "piedmont+mountains_near" },
  { name: "Raleigh, NC", population: 1500000, driveHours: 13, hasAirport: true, geography: "piedmont" },
  { name: "Virginia Beach, VA", population: 1800000, driveHours: 14, hasAirport: true, geography: "coast" },
  { name: "Washington, DC", population: 6400000, driveHours: 12, hasAirport: true, geography: "river+piedmont" },
  { name: "Detroit, MI", population: 4400000, driveHours: 6, hasAirport: true, geography: "river+lakes" },
  { name: "Cleveland, OH", population: 2100000, driveHours: 6, hasAirport: true, geography: "lake+river" },
  { name: "Portland, OR", population: 2500000, driveHours: 32, hasAirport: true, geography: "river+mountains" },
  { name: "Las Vegas, NV", population: 2300000, driveHours: 26, hasAirport: true, geography: "desert+mountains" },
  { name: "Salt Lake City, UT", population: 1300000, driveHours: 20, hasAirport: true, geography: "mountains+lake" },
  { name: "Kansas City, MO", population: 2200000, driveHours: 8, hasAirport: true, geography: "river+plains" },
  { name: "St. Louis, MO", population: 2800000, driveHours: 5, hasAirport: true, geography: "river+bluffs" },
  { name: "Memphis, TN", population: 1400000, driveHours: 9, hasAirport: true, geography: "river+bluffs" },
  { name: "Louisville, KY", population: 1400000, driveHours: 5, hasAirport: true, geography: "river+hills" },
  { name: "Richmond, VA", population: 1350000, driveHours: 13, hasAirport: true, geography: "river+piedmont" },
  { name: "Hartford, CT", population: 1200000, driveHours: 14, hasAirport: false, geography: "river+hills" },
  { name: "Buffalo, NY", population: 1200000, driveHours: 8, hasAirport: true, geography: "lake+river" },
  { name: "Birmingham, AL", population: 1150000, driveHours: 10, hasAirport: true, geography: "mountains+river" },
  { name: "New Orleans, LA", population: 1300000, driveHours: 14, hasAirport: true, geography: "river+coast" },
  { name: "Oklahoma City, OK", population: 1450000, driveHours: 13, hasAirport: true, geography: "plains+river" },
  { name: "Tucson, AZ", population: 1050000, driveHours: 24, hasAirport: true, geography: "desert+mountains" },
  { name: "Albuquerque, NM", population: 950000, driveHours: 20, hasAirport: true, geography: "desert+mountains+river" },
  { name: "Honolulu, HI", population: 1000000, driveHours: 99, hasAirport: true, geography: "island+mountains" },
  { name: "Providence, RI", population: 1650000, driveHours: 15, hasAirport: true, geography: "coast+bay" },
  { name: "Milwaukee, WI", population: 1600000, driveHours: 0, hasAirport: true, geography: "lake" },
  { name: "Greenville, SC", population: 950000, driveHours: 11, hasAirport: true, geography: "mountains+river" },
  { name: "Chattanooga, TN", population: 600000, driveHours: 8, hasAirport: false, geography: "mountains+river" },
  { name: "Asheville, NC", population: 480000, driveHours: 10, hasAirport: true, geography: "mountains" },
  { name: "Boise, ID", population: 800000, driveHours: 26, hasAirport: true, geography: "mountains+river" },
  { name: "Colorado Springs, CO", population: 750000, driveHours: 15, hasAirport: true, geography: "mountains" },
  { name: "Spokane, WA", population: 600000, driveHours: 28, hasAirport: true, geography: "river+mountains" },
  { name: "Little Rock, AR", population: 750000, driveHours: 10, hasAirport: true, geography: "river+hills" },
  { name: "Tulsa, OK", population: 1000000, driveHours: 11, hasAirport: true, geography: "river+hills" },
  { name: "Grand Rapids, MI", population: 1100000, driveHours: 3, hasAirport: true, geography: "river+dunes" },
  { name: "Dayton, OH", population: 850000, driveHours: 5, hasAirport: true, geography: "river+hills" },
  { name: "Akron, OH", population: 700000, driveHours: 6, hasAirport: false, geography: "hills" },
  { name: "Syracuse, NY", population: 650000, driveHours: 10, hasAirport: true, geography: "lake+hills" },
  { name: "Worcester, MA", population: 950000, driveHours: 14, hasAirport: false, geography: "hills" },
  // Additional metros referenced by programs
  { name: "Atlanta, GA", population: 6200000, driveHours: 11, hasAirport: true, geography: "piedmont+hills" },
  { name: "Houston, TX", population: 7200000, driveHours: 17, hasAirport: true, geography: "flat+coast_near" },
  { name: "Chicago, IL", population: 9500000, driveHours: 1.5, hasAirport: true, geography: "lake" },
  { name: "Nashville, TN", population: 2000000, driveHours: 8, hasAirport: true, geography: "river+hills" },
  { name: "Pittsburgh, PA", population: 2400000, driveHours: 7, hasAirport: true, geography: "river+hills+mountains_near" },
  { name: "Denver, CO", population: 2900000, driveHours: 15, hasAirport: true, geography: "mountains+plains" },
  { name: "Seattle, WA", population: 4000000, driveHours: 30, hasAirport: true, geography: "mountains+bay+river" },
  { name: "Boston, MA", population: 4900000, driveHours: 15, hasAirport: true, geography: "coast+bay" },
  { name: "Philadelphia, PA", population: 6200000, driveHours: 12, hasAirport: true, geography: "river+piedmont" },
  { name: "Cincinnati, OH", population: 2200000, driveHours: 5, hasAirport: true, geography: "river+hills" },
  { name: "Columbus, OH", population: 2100000, driveHours: 6, hasAirport: true, geography: "river+flat" },
  { name: "Madison, WI", population: 680000, driveHours: 1.5, hasAirport: true, geography: "lakes+hills" },
  { name: "Omaha, NE", population: 950000, driveHours: 8, hasAirport: true, geography: "river+plains" },
  { name: "Dallas, TX", population: 7600000, driveHours: 15, hasAirport: true, geography: "plains" },
  { name: "New York, NY", population: 20100000, driveHours: 14, hasAirport: true, geography: "coast+river" },
  { name: "Phoenix, AZ", population: 4900000, driveHours: 24, hasAirport: true, geography: "desert+mountains_near" },
  { name: "Los Angeles, CA", population: 13200000, driveHours: 28, hasAirport: true, geography: "coast+mountains" },
  { name: "Knoxville, TN", population: 900000, driveHours: 8, hasAirport: true, geography: "mountains+river" },
  { name: "Lexington, KY", population: 520000, driveHours: 5, hasAirport: true, geography: "hills+bluegrass" },
  { name: "Charleston, SC", population: 850000, driveHours: 13, hasAirport: true, geography: "coast+river" },
  { name: "New Haven, CT", population: 870000, driveHours: 14, hasAirport: false, geography: "coast+hills" },
  { name: "Toledo, OH", population: 650000, driveHours: 4, hasAirport: true, geography: "river+lake_near" },
  { name: "Rochester, NY", population: 1100000, driveHours: 9, hasAirport: true, geography: "lake+river" },
  { name: "Burlington, VT", population: 230000, driveHours: 14, hasAirport: true, geography: "lake+mountains" },
  { name: "Durham, NC", population: 1500000, driveHours: 13, hasAirport: true, geography: "piedmont" },
  { name: "Minneapolis, MN", population: 3700000, driveHours: 5, hasAirport: true, geography: "lakes+river" },
  { name: "Oakland, CA", population: 4700000, driveHours: 30, hasAirport: true, geography: "bay+hills" },
];

// ─── SCORING FUNCTIONS ──────────────────────────────────────────────

/** Distance from Milwaukee (0-3) — unchanged */
function scoreDistance(driveHours, hasAirport) {
  if (driveHours >= 4 && driveHours <= 8 && hasAirport) return 3.0;
  if (driveHours >= 1 && driveHours <= 4) return 2.5;
  if ((driveHours >= 4 && driveHours <= 8 && !hasAirport) || (driveHours > 8 && hasAirport)) return 2.0;
  if (driveHours < 1 || (driveHours >= 8 && driveHours <= 12 && !hasAirport)) return 1.0;
  if (driveHours > 12 && !hasAirport) return 0.0;
  return 2.0;
}

/** Geography (0-2.5) — scaled from old 0-3 range (×2.5/3) */
function scoreGeography(geography) {
  let raw;
  if (geography.includes('river') && (geography.includes('mountain') || geography.includes('hill') || geography.includes('bluff'))) raw = 3.0;
  else if (geography.includes('mountain') || geography.includes('lake')) raw = 2.0;
  else if (geography.includes('hill') || geography.includes('hiking') || geography.includes('coast')) raw = 1.5;
  else if (geography.includes('river') || geography.includes('piedmont')) raw = 1.0;
  else raw = 0.5;
  return Math.round(raw * (2.5 / 3) * 100) / 100;
}

/** Size Preference (0-1) — based on metro population */
function scoreSizePreference(population) {
  if (population >= 500000 && population <= 1500000) return 1.0;  // sweet spot
  if (population > 1500000) return 0.8;
  if (population >= 250000 && population < 500000) return 0.7;
  if (population >= 100000 && population < 250000) return 0.3;
  return 0.0;  // <100K
}

// ─── COOL FACTOR (0-2, research-based) ──────────────────────────────
// Cultural appeal: food, arts, nightlife, walkability, young-adult vibe, growth energy
const COOL_FACTOR = {
  // 2.0 — Top-tier cultural cities
  "Portland, OR": 2.0,
  "Austin, TX": 2.0,
  "Nashville, TN": 2.0,
  "New Orleans, LA": 2.0,
  "Denver, CO": 2.0,
  "San Francisco, CA": 2.0,
  "Chicago, IL": 2.0,
  "New York, NY": 2.0,

  // 1.5 — Strong cultural draw
  "Seattle, WA": 1.5,
  "Memphis, TN": 1.5,
  "Louisville, KY": 1.5,
  "Asheville, NC": 1.5,
  "Salt Lake City, UT": 1.5,
  "San Diego, CA": 1.5,
  "Raleigh, NC": 1.5,
  "Minneapolis, MN": 1.5,
  "Los Angeles, CA": 1.5,
  "Boston, MA": 1.5,
  "Philadelphia, PA": 1.5,
  "Washington, DC": 1.5,
  "Atlanta, GA": 1.5,
  "Miami, FL": 1.5,
  "Pittsburgh, PA": 1.5,
  "Madison, WI": 1.5,
  "Burlington, VT": 1.5,
  "Charleston, SC": 1.5,

  // 1.0 — Moderate cultural appeal
  "Cleveland, OH": 1.0,
  "Birmingham, AL": 1.0,
  "Boise, ID": 1.0,
  "Charlotte, NC": 1.0,
  "Tucson, AZ": 1.0,
  "Tampa, FL": 1.0,
  "Kansas City, MO": 1.0,
  "Cincinnati, OH": 1.0,
  "Columbus, OH": 1.0,
  "Detroit, MI": 1.0,
  "Houston, TX": 1.0,
  "Dallas, TX": 1.0,
  "St. Louis, MO": 1.0,
  "Knoxville, TN": 1.0,
  "Richmond, VA": 1.0,
  "Greenville, SC": 1.0,
  "Chattanooga, TN": 1.0,
  "Lexington, KY": 1.0,
  "Las Vegas, NV": 1.0,
  "Phoenix, AZ": 1.0,
  "New Haven, CT": 1.0,
  "Albuquerque, NM": 1.0,
  "Indianapolis, IN": 1.0,
  "Providence, RI": 1.0,
  "Durham, NC": 1.0,
  "Oakland, CA": 1.0,
  "Rochester, NY": 1.0,

  // 0.5 — Below-average cultural draw
  "Dayton, OH": 0.5,
  "Akron, OH": 0.5,
  "Syracuse, NY": 0.5,
  "Oklahoma City, OK": 0.5,
  "Spokane, WA": 0.5,
  "Hartford, CT": 0.5,
  "Omaha, NE": 0.5,
  "Grand Rapids, MI": 0.5,
  "Little Rock, AR": 0.5,
  "Tulsa, OK": 0.5,
  "Buffalo, NY": 0.5,
  "San Antonio, TX": 0.5,
  "San Jose, CA": 0.5,
  "Sacramento, CA": 0.5,
  "Orlando, FL": 0.5,
  "Jacksonville, FL": 0.5,
  "Virginia Beach, VA": 0.5,
  "Honolulu, HI": 0.5,
  "Colorado Springs, CO": 0.5,
  "Worcester, MA": 0.5,
  "Milwaukee, WI": 0.5,
  "Toledo, OH": 0.5,
};

function scoreCoolFactor(metroName) {
  return COOL_FACTOR[metroName] ?? 0.5;
}

// ─── BONUS ARRAYS ───────────────────────────────────────────────────

// Food: Known food destinations
const FOOD_CITIES = [
  'New Orleans, LA', 'Austin, TX', 'Portland, OR', 'San Francisco, CA',
  'Memphis, TN', 'Louisville, KY', 'Charleston, SC', 'Asheville, NC',
  'Nashville, TN', 'Kansas City, MO', 'Chicago, IL', 'Miami, FL',
  'San Diego, CA', 'New York, NY', 'Los Angeles, CA', 'Houston, TX',
  'Philadelphia, PA'
];

// Events: Comedy, festivals, live music, cultural events scene
const EVENTS_CITIES = [
  'Austin, TX', 'Nashville, TN', 'New Orleans, LA', 'Memphis, TN',
  'Portland, OR', 'Seattle, WA', 'Cleveland, OH', 'Detroit, MI',
  'Chicago, IL', 'San Francisco, CA', 'Kansas City, MO', 'Minneapolis, MN',
  'New York, NY', 'Los Angeles, CA', 'Denver, CO', 'Atlanta, GA',
  'Philadelphia, PA', 'Boston, MA'
];

// Dating: High young-professional %, transplant rate, social scene
const DATING_FRIENDLY = [
  'Austin, TX', 'Denver, CO', 'Washington, DC', 'Charlotte, NC',
  'Raleigh, NC', 'Nashville, TN', 'Portland, OR', 'Seattle, WA',
  'Minneapolis, MN', 'San Diego, CA', 'Tampa, FL', 'Salt Lake City, UT',
  'Columbus, OH', 'Indianapolis, IN', 'Kansas City, MO', 'Boise, ID',
  'Colorado Springs, CO', 'Atlanta, GA', 'Dallas, TX', 'Chicago, IL',
  'Pittsburgh, PA', 'Madison, WI'
];

// Student Vibe: Cities with large student populations
const STUDENT_VIBE_CITIES = [
  'Austin, TX',         // UT Austin
  'Madison, WI',        // UW-Madison
  'Columbus, OH',       // Ohio State
  'Knoxville, TN',      // UT Knoxville
  'Tucson, AZ',         // U of Arizona
  'Albuquerque, NM',    // UNM
  'Raleigh, NC',        // NC State + nearby UNC
  'Durham, NC',         // Duke + NC Central
  'Salt Lake City, UT', // U of Utah
  'Boise, ID',          // Boise State
  'Burlington, VT',     // UVM
  'Lexington, KY',      // UK
  'Boston, MA',         // BU, Northeastern, BC, MIT, Harvard
  'Philadelphia, PA',   // Penn, Temple, Drexel
  'Atlanta, GA',        // Georgia Tech, Emory, Georgia State
  'Pittsburgh, PA',     // Pitt, CMU, Duquesne
  'Nashville, TN',      // Vanderbilt, Belmont, TSU
  'New Orleans, LA',    // Tulane, Loyola, UNO
  'Minneapolis, MN',    // U of Minnesota
  'Cincinnati, OH',     // UC
  'Cleveland, OH',      // CSU, Case Western
  'Detroit, MI',        // Wayne State, U of D Mercy
  'Denver, CO',         // DU, CU Denver, Regis
  'Chicago, IL',        // UChicago, Northwestern, DePaul, Loyola, UIC
  'Seattle, WA',        // UW, Seattle U, SPU
  'Portland, OR',       // PSU, OHSU, Reed
  'San Francisco, CA',  // UCSF, USF, SFSU
  'Los Angeles, CA',    // UCLA, USC, Cal State LA
  'New York, NY',       // Columbia, NYU, CUNY, etc.
  'Providence, RI',     // Brown, RISD, Providence College
  'Buffalo, NY',        // UB
  'Syracuse, NY',       // Syracuse University
  'Birmingham, AL',     // UAB
  'Memphis, TN',        // U of Memphis
  'Omaha, NE',          // Creighton, UNO
  'Tulsa, OK',          // TU, ORU
  'Oklahoma City, OK',  // OU Health Sciences, UCO
  'Houston, TX',        // UH, Rice
  'San Diego, CA',      // UCSD, SDSU, USD
  'Tampa, FL',          // USF
  'Orlando, FL',        // UCF
  'Milwaukee, WI',      // UWM, Marquette
  'Kansas City, MO',    // UMKC, Rockhurst
  'Indianapolis, IN',   // IU, Butler
  'Louisville, KY',     // U of L
  'Rochester, NY',      // U of Rochester, RIT
  'Honolulu, HI',       // UH Manoa
  'Richmond, VA',       // VCU, U of Richmond
  'Hartford, CT',       // UConn Hartford, Trinity
  'New Haven, CT',      // Yale, SCSU
  'Charleston, SC',     // MUSC, College of Charleston
  'Charlotte, NC',      // UNC Charlotte
  'Greenville, SC',     // Clemson (nearby), Furman
  'Washington, DC',     // Georgetown, GWU, Howard, AU
  'Dallas, TX',         // SMU, UTD, UNT Dallas
  'Phoenix, AZ',        // ASU, GCU
  'Las Vegas, NV',      // UNLV
];

// ─── MANUAL BONUS (user overrides) ──────────────────────────────────
// Specific city bonuses only — no regional penalties.
const MANUAL_CITY_BONUS = {
  'Pittsburgh, PA': +1.0,
  'Spokane, WA': +0.75,
  'Austin, TX': +0.75,
  'Chicago, IL': +0.75,
  'New Orleans, LA': +0.75,
  'Memphis, TN': +0.25,
  'Denver, CO': -0.75,
  'St. Louis, MO': +0.25,
  'Seattle, WA': +0.5,
};

function getManualBonus(metroName) {
  if (MANUAL_CITY_BONUS[metroName] !== undefined) {
    return { value: MANUAL_CITY_BONUS[metroName], reason: 'user_override' };
  }
  return { value: 0, reason: null };
}

// States with full NP practice authority
const FULL_NP_PRACTICE_AUTHORITY_STATES = [
  'AZ', 'CO', 'CT', 'DC', 'HI', 'ID', 'IA', 'ME', 'MD', 'MN', 'MT',
  'NE', 'NV', 'NH', 'NM', 'ND', 'OR', 'RI', 'SD', 'VT', 'WA', 'WY'
];

// ─── NP PATHWAY ESTIMATES ───────────────────────────────────────────
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
  'Milwaukee, WI': { ed: 0.75, np: 0.70, underserved: 0.80 },
  // New metros for programs
  'Atlanta, GA': { ed: 0.90, np: 0.85, underserved: 0.80 },
  'Houston, TX': { ed: 0.90, np: 0.85, underserved: 0.85 },
  'Chicago, IL': { ed: 0.90, np: 0.90, underserved: 0.85 },
  'Nashville, TN': { ed: 0.85, np: 0.80, underserved: 0.80 },
  'Pittsburgh, PA': { ed: 0.85, np: 0.85, underserved: 0.80 },
  'Denver, CO': { ed: 0.80, np: 0.85, underserved: 0.75 },
  'Seattle, WA': { ed: 0.85, np: 0.85, underserved: 0.75 },
  'Boston, MA': { ed: 0.90, np: 0.90, underserved: 0.75 },
  'Philadelphia, PA': { ed: 0.90, np: 0.85, underserved: 0.85 },
  'Cincinnati, OH': { ed: 0.80, np: 0.80, underserved: 0.80 },
  'Columbus, OH': { ed: 0.80, np: 0.80, underserved: 0.75 },
  'Madison, WI': { ed: 0.70, np: 0.75, underserved: 0.70 },
  'Omaha, NE': { ed: 0.75, np: 0.75, underserved: 0.80 },
  'Dallas, TX': { ed: 0.85, np: 0.85, underserved: 0.80 },
  'New York, NY': { ed: 0.95, np: 0.90, underserved: 0.85 },
  'Phoenix, AZ': { ed: 0.80, np: 0.80, underserved: 0.80 },
  'Los Angeles, CA': { ed: 0.90, np: 0.85, underserved: 0.85 },
  'Knoxville, TN': { ed: 0.75, np: 0.75, underserved: 0.80 },
  'Lexington, KY': { ed: 0.75, np: 0.75, underserved: 0.80 },
  'Charleston, SC': { ed: 0.75, np: 0.75, underserved: 0.75 },
  'New Haven, CT': { ed: 0.80, np: 0.80, underserved: 0.70 },
  'Toledo, OH': { ed: 0.65, np: 0.70, underserved: 0.75 },
  'Rochester, NY': { ed: 0.75, np: 0.80, underserved: 0.75 },
  'Burlington, VT': { ed: 0.60, np: 0.65, underserved: 0.80 },
  'Durham, NC': { ed: 0.80, np: 0.85, underserved: 0.75 },
  'Minneapolis, MN': { ed: 0.85, np: 0.85, underserved: 0.75 },
  'Oakland, CA': { ed: 0.90, np: 0.85, underserved: 0.85 },
};

// ─── UTILITIES ──────────────────────────────────────────────────────

function getStateAbbrev(metroName) {
  const match = metroName.match(/, ([A-Z]{2})$/);
  return match ? match[1] : null;
}

// ─── CALCULATE SCORES ───────────────────────────────────────────────

const results = METROS_TO_SCORE.map(metro => {
  const distScore = scoreDistance(metro.driveHours, metro.hasAirport);
  const geoScore = scoreGeography(metro.geography);
  const coolFactor = scoreCoolFactor(metro.name);
  const sizePreference = scoreSizePreference(metro.population);
  const desirabilityScore = coolFactor + sizePreference;

  // Bonuses (each +0.25, max 1.0)
  const foodBonus = FOOD_CITIES.includes(metro.name) ? 0.25 : 0;
  const eventsBonus = EVENTS_CITIES.includes(metro.name) ? 0.25 : 0;
  const datingBonus = DATING_FRIENDLY.includes(metro.name) ? 0.25 : 0;
  const studentVibeBonus = STUDENT_VIBE_CITIES.includes(metro.name) ? 0.25 : 0;
  const bonusTotal = foodBonus + eventsBonus + datingBonus + studentVibeBonus;

  // locationScore = dist + geo + desirability + bonuses (base max 9.5)
  const baseLocationScore = distScore + geoScore + desirabilityScore + bonusTotal;

  // Manual bonus (user overrides / regional penalties)
  const manual = getManualBonus(metro.name);
  const locationScore = baseLocationScore + manual.value;

  // location_boost = npPractice only (+0.5 or 0)
  const stateAbbrev = getStateAbbrev(metro.name);
  const npPracticeBonus = FULL_NP_PRACTICE_AUTHORITY_STATES.includes(stateAbbrev) ? 0.5 : 0;

  // NP Pathway
  const np = NP_PATHWAY_ESTIMATES[metro.name] || { ed: 0.70, np: 0.70, underserved: 0.70 };
  const npPathway = 0.35 * np.ed + 0.40 * np.np + 0.25 * np.underserved;

  const combinedScore = (locationScore + npPracticeBonus) * npPathway;

  return {
    name: metro.name,
    population: metro.population,
    locationScore: Math.round(locationScore * 100) / 100,
    distScore,
    geoScore,
    coolFactor,
    sizePreference,
    desirabilityScore: Math.round(desirabilityScore * 100) / 100,
    bonuses: {
      food: foodBonus,
      events: eventsBonus,
      dating: datingBonus,
      studentVibe: studentVibeBonus,
      total: bonusTotal
    },
    manual_bonus: manual.value,
    manual_reason: manual.reason,
    location_boost: npPracticeBonus,
    npPathway: Math.round(npPathway * 100) / 100,
    combinedScore: Math.round(combinedScore * 100) / 100,
  };
}).sort((a, b) => b.combinedScore - a.combinedScore);

// ─── OUTPUT ─────────────────────────────────────────────────────────

console.log('\n=== TOP 30 METROS FOR NURSING PROGRAM ===\n');
console.log('Rank | Metro'.padEnd(35) + 'Loc  | Boost | NP  | Combined | Cool | Size');
console.log('='.repeat(90));
results.slice(0, 30).forEach((r, i) => {
  const flags = [];
  if (r.location_boost > 0) flags.push('NP');
  if (r.bonuses.food > 0) flags.push('F');
  if (r.bonuses.events > 0) flags.push('E');
  if (r.bonuses.dating > 0) flags.push('D');
  if (r.bonuses.studentVibe > 0) flags.push('S');
  if (r.manual_bonus !== 0) flags.push(r.manual_bonus > 0 ? 'M+' : 'M-');
  const flagStr = flags.join('') || '-';
  console.log(
    `#${(i+1).toString().padStart(2)} | ${r.name.padEnd(28)} ${r.locationScore.toFixed(1).padStart(5)} | ${('+'+r.location_boost.toFixed(1)).padStart(5)} | ${r.npPathway.toFixed(2).padStart(4)} | ${r.combinedScore.toFixed(2).padStart(6)}   | ${r.coolFactor.toFixed(1)} | ${r.sizePreference.toFixed(1)} | ${(r.manual_bonus >= 0 ? '+' : '') + r.manual_bonus.toFixed(2)}  [${flagStr}]`
  );
});

console.log('\nBonus Legend: NP=Full Practice Authority, F=Food, E=Events, D=Dating, S=Student Vibe\n');

// Show all metros
console.log('\n=== ALL METROS ===\n');
results.forEach((r, i) => {
  console.log(`#${(i+1).toString().padStart(2)} ${r.name.padEnd(28)} loc=${r.locationScore.toFixed(1)} boost=${r.location_boost.toFixed(1)} manual=${(r.manual_bonus>=0?'+':'')+r.manual_bonus.toFixed(2)} np=${r.npPathway.toFixed(2)} combined=${r.combinedScore.toFixed(2)} cool=${r.coolFactor} size=${r.sizePreference}`);
});

// Save to JSON
const outputPath = path.join(__dirname, 'metro-scores.json');
fs.writeFileSync(outputPath, JSON.stringify({
  methodology: {
    version: 2,
    location_base_max: 9.5,
    location_boost_max: 0.5,
    location_total_max: 10,
    components: {
      distance_max: 3,
      geography_max: 2.5,
      desirability_max: 3,
      bonuses_max: 1
    },
    desirability: {
      cool_factor: "0-2 research-based cultural appeal score",
      size_preference: "0-1 based on metro population strata"
    },
    size_preference_strata: {
      "500K-1.5M": 1.0,
      ">1.5M": 0.8,
      "250K-500K": 0.7,
      "100K-250K": 0.3,
      "<100K": 0.0
    },
    bonuses: {
      food: "+0.25 for cities known for food culture",
      events: "+0.25 for cities with comedy, festivals, live music, cultural events",
      dating: "+0.25 for cities with high young professional %, transplant rate, social scene",
      student_vibe: "+0.25 for college towns with large state universities"
    },
    manual_bonus: {
      description: "User overrides for specific cities",
      city_overrides: MANUAL_CITY_BONUS
    },
    location_boost: "npPractice only: +0.5 for states with full NP practice authority",
    np_pathway_formula: "0.35 × ed_opportunity + 0.40 × np_accessibility + 0.25 × underserved_access"
  },
  metros: results
}, null, 2));

console.log(`\nSaved ${results.length} metro scores to ${outputPath}`);
