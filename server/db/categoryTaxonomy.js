const CATEGORY_TAXONOMY = {
  Food: ['Meal Kits', 'Food Delivery', 'Snacks & Food', 'Restaurants', 'Grocery', 'Beverages'],
  Beauty: ['Skincare', 'Makeup', 'Health & Beauty', 'Personal Care', 'Haircare', 'Fragrance'],
  Gaming: ['Gaming Peripherals', 'Gaming Chairs', 'Game Publishers', 'Esports', 'Streaming Tools'],
  Tech: ['Software', 'Hardware', 'Streaming Platforms', 'Apps', 'E-Commerce', 'Subscription Services'],
  Lifestyle: ['Clothing', 'Fitness', 'Home Goods', 'Athleisure', 'Travel'],
  Health: ['Supplements', 'Wellness', 'Health & Wellness', 'Personal Care', 'Energy Drinks'],
  Fashion: ['Clothing', 'Accessories', 'Athleisure', 'Luxury Goods'],
  Finance: ['Financial Services', 'Crypto', 'Investing', 'Banking'],
  Entertainment: ['Media', 'Music', 'Film', 'Events'],
};

const ALL_SUBCATEGORIES = [...new Set(Object.values(CATEGORY_TAXONOMY).flat())];

function deriveParentCategories(categories) {
  const parents = new Set();
  for (const cat of categories) {
    for (const [parent, subcats] of Object.entries(CATEGORY_TAXONOMY)) {
      if (subcats.includes(cat)) parents.add(parent);
    }
  }
  return [...parents];
}

// Returns parent categories for a single subcategory
function getParentsForCategory(category) {
  const parents = [];
  for (const [parent, subcats] of Object.entries(CATEGORY_TAXONOMY)) {
    if (subcats.includes(category)) parents.push(parent);
  }
  return parents;
}

// Given a controversy's relevance_to_brands array and a brand's categories array,
// returns the matching categories (direct + via shared parent)
function getCategoryOverlap(controversyCategories, brandCategories) {
  const directMatches = controversyCategories.filter(c => brandCategories.includes(c));

  const sharedParents = [];
  const controversyParents = deriveParentCategories(controversyCategories);
  const brandParents = deriveParentCategories(brandCategories);
  for (const p of controversyParents) {
    if (brandParents.includes(p)) sharedParents.push(p);
  }

  return { directMatches, sharedParents };
}

// Returns match level: 'direct', 'parent', or null
function getControversionMatchLevel(controversyCategories, brandCategories) {
  const { directMatches, sharedParents } = getCategoryOverlap(controversyCategories, brandCategories);
  if (directMatches.length > 0) return 'direct';
  if (sharedParents.length > 0) return 'parent';
  return null;
}

module.exports = {
  CATEGORY_TAXONOMY,
  ALL_SUBCATEGORIES,
  deriveParentCategories,
  getParentsForCategory,
  getCategoryOverlap,
  getControversionMatchLevel,
};
