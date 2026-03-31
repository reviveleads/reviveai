import { LeadIntent } from '@/types'

const LUXURY_BRANDS = [
  'mercedes', 'benz', 'bmw', 'audi', 'cadillac', 'lexus', 'lincoln', 'infiniti',
  'acura', 'genesis', 'volvo', 'porsche', 'land rover', 'jaguar', 'rivian', 'lucid',
  'bentley', 'rolls-royce', 'ferrari', 'lamborghini', 'maserati', 'alfa romeo',
]

const PREMIUM_TRIMS = [
  'denali', 'lariat', 'limited', 'platinum', 'king ranch', 'raptor', 'trd pro',
  'laramie longhorn', 'laramie', 'amg', 'm sport', 'm package', 'titanium', 'elite',
  'premier', 'slt', 'at4', 'high country', 'trailboss', 'trail boss', 'zr2',
  'touring', 'sport touring', 'ex-l', 'exl', 'overland', 'summit', 'sahara',
  'rubicon', 'trailhawk', 'high altitude', 'apex', 'nightshade', 'supersport',
  'signature', 'prestige', 'sport technology', 'black badge', 'f sport',
  'premium plus', 's line', 'sport line', 'luxury', 'exclusiv', 'avenir',
  'sport package', 'sport edition',
]

const BUDGET_SIGNALS = [
  'under $', 'around $', 'budget', 'affordable', 'cheap',
  'used ', 'pre-owned', 'preowned', 'certified pre', 'cpо',
  'any', 'or similar', 'something like', 'truck around', 'suv under',
  'car around', 'pickup around',
]

export function classifyIntent(vehicleInterest: string): LeadIntent {
  const lower = vehicleInterest.toLowerCase()

  // Explicit budget signals win immediately
  if (BUDGET_SIGNALS.some(s => lower.includes(s))) return 'budget_driven'

  // Luxury brand → model_loyal
  if (LUXURY_BRANDS.some(b => lower.includes(b))) return 'model_loyal'

  // Specific premium trim → model_loyal
  if (PREMIUM_TRIMS.some(t => lower.includes(t))) return 'model_loyal'

  // Year-based classification
  const yearMatch = lower.match(/\b(19|20)(\d{2})\b/)
  if (yearMatch) {
    const year = parseInt(yearMatch[0])
    if (year >= 2022) return 'model_loyal'
    if (year <= 2021) return 'budget_driven'
  }

  // No year, no trim, no luxury → default model_loyal (specific interest = loyal)
  return 'model_loyal'
}

// Map from brand name → keywords to look for in vehicle_interest strings
export const BRAND_KEYWORDS: Record<string, string[]> = {
  'Chevy': ['chevy', 'chevrolet', 'silverado', 'equinox', 'tahoe', 'suburban', 'malibu',
    'camaro', 'corvette', 'traverse', 'blazer', 'colorado', 'trailblazer', 'trax', 'bolt', 'spark'],
  'GMC': ['gmc', 'sierra', 'yukon', 'terrain', 'canyon', 'acadia', 'envoy', 'envision', 'hummer ev'],
  'Ford': ['ford', 'f-150', 'f150', 'mustang', 'explorer', 'escape', 'bronco', 'edge',
    'ranger', 'expedition', 'maverick', 'transit', 'fusion', 'flex'],
  'Ram': ['ram 1500', 'ram 2500', 'ram 3500', 'ram pickup', 'promaster', ' ram '],
  'Toyota': ['toyota', 'camry', 'corolla', 'rav4', 'tacoma', 'tundra', 'prius', 'highlander',
    '4runner', 'sienna', 'venza', 'bz4x', 'sequoia', 'land cruiser'],
  'Honda': ['honda', 'civic', 'accord', 'cr-v', 'crv', 'pilot', 'odyssey', 'ridgeline',
    'passport', 'hr-v', 'hrv', 'fit', 'insight'],
  'Nissan': ['nissan', 'altima', 'rogue', 'pathfinder', 'frontier', 'armada', 'sentra',
    'murano', 'kicks', 'titan', 'maxima', 'versa'],
  'Hyundai': ['hyundai', 'elantra', 'sonata', 'tucson', 'santa fe', 'palisade', 'ioniq',
    'kona', 'nexo', 'veloster'],
  'Kia': ['kia', 'telluride', 'sportage', 'sorento', 'forte', 'k5', 'carnival', 'ev6',
    'niro', 'soul', 'stinger'],
  'Subaru': ['subaru', 'outback', 'forester', 'impreza', 'legacy', 'crosstrek', 'wrx',
    'ascent', 'brz', 'solterra'],
  'Jeep': ['jeep', 'wrangler', 'grand cherokee', 'compass', 'renegade', 'gladiator',
    'grand wagoneer', 'wagoneer'],
  'Dodge': ['dodge', 'charger', 'challenger', 'durango', 'dart', 'journey', 'hornet'],
  'Mercedes': ['mercedes', 'mercedes-benz', ' amg ', 'glc', 'gle', 'gls', 'c-class',
    'e-class', 's-class', 'glb', 'gla', 'eqs', 'sprinter'],
  'BMW': ['bmw', ' m3', ' m5', ' m4', ' m2', 'x5', 'x3', 'x7', 'x1', '3 series',
    '5 series', '7 series', 'i4', ' ix '],
  'Audi': ['audi', ' a4', ' a6', ' a8', ' q5', ' q7', ' q8', 'e-tron', ' rs ', ' a3', ' q3'],
  'Cadillac': ['cadillac', 'escalade', 'ct5', 'ct4', 'xt5', 'xt6', 'lyriq', 'xt4', 'celestiq'],
  'Lexus': ['lexus', ' rx ', ' es ', ' nx ', ' gx ', ' lx ', ' is ', ' ux ', ' ls ', ' tx ', ' rz '],
  'Buick': ['buick', 'enclave', 'encore', 'envision', 'lacrosse', 'verano'],
  'Chrysler': ['chrysler', 'pacifica', '300 ', 'voyager', 'airflow'],
  'Lincoln': ['lincoln', 'navigator', 'aviator', 'corsair', 'nautilus', 'continental'],
  'Mazda': ['mazda', 'cx-5', 'cx-9', 'cx-90', 'cx-50', 'mazda3', 'mazda6', 'miata', 'mx-5'],
  'Mitsubishi': ['mitsubishi', 'outlander', 'eclipse cross', 'galant', 'lancer', 'pajero'],
  'Acura': ['acura', 'mdx', 'rdx', 'tlx', 'integra', ' nsx', 'zdx'],
  'Infiniti': ['infiniti', ' qx', ' q50', ' q60', ' q70', 'qx80', 'qx60', 'qx55', 'qx50'],
  'Genesis': ['genesis', 'gv80', 'gv70', 'gv60', ' g80', ' g70', ' g90', 'electrified'],
  'Volvo': ['volvo', 'xc90', 'xc60', 'xc40', ' s60', ' s90', ' v60', ' v90', ' ex90', ' ex30'],
  'Porsche': ['porsche', 'cayenne', 'macan', 'panamera', '911', 'taycan', 'boxster', 'cayman'],
  'Land Rover': ['land rover', 'range rover', 'defender', 'discovery', 'freelander', 'evoque', 'velar'],
  'Jaguar': ['jaguar', ' f-pace', ' e-pace', ' i-pace', ' f-type', ' xe ', ' xf ', ' xj '],
  'Alfa Romeo': ['alfa romeo', 'alfa', 'giulia', 'stelvio', 'tonale', 'giulietta'],
  'Rivian': ['rivian', ' r1t', ' r1s', ' r2 ', ' r3 ', 'rivian truck', 'rivian suv'],
  'Tesla': ['tesla', 'model s', 'model 3', 'model x', 'model y', 'cybertruck', 'roadster', 'semi'],
  'Volkswagen': ['volkswagen', ' vw ', 'jetta', 'passat', 'tiguan', 'atlas', 'golf', 'arteon', 'id.4', 'id.buzz'],
}

// Extract the most likely brand from a vehicle interest string
export function extractBrand(vehicleInterest: string): string | null {
  const lower = ` ${vehicleInterest.toLowerCase()} `
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return brand
  }
  return null
}

// Extract vehicle category (for inventory matching)
export function extractVehicleCategory(vehicleInterest: string): string {
  const lower = vehicleInterest.toLowerCase()
  if (/truck|pickup|silverado|sierra|f-?150|ram\s+\d|tundra|tacoma|canyon|ranger|frontier|titan|colorado|gladiator|maverick|ridgeline/.test(lower)) return 'truck'
  if (/suv|crossover|explorer|equinox|rav4|highlander|cr-?v|rogue|escape|traverse|acadia|tahoe|suburban|yukon|expedition|4runner|pilot|pathfinder|murano|ascent|outback|forester|bronco|wrangler|grand cherokee|santa fe|palisade|sorento|telluride|tucson|sportage/.test(lower)) return 'suv'
  if (/sedan|camry|accord|altima|sonata|elantra|civic|corolla|malibu|impala|charger|challenger|fusion|passat|jetta/.test(lower)) return 'sedan'
  if (/van|odyssey|sienna|caravan|transit|pacifica|carnival|minivan/.test(lower)) return 'van'
  if (/sports|mustang|camaro|corvette|supra|rx-?7|brz|wrx|gt\b|coupe/.test(lower)) return 'sports'
  return 'general'
}
