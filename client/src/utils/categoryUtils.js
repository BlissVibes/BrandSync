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

export function deriveParentCategories(categories) {
  const parents = new Set();
  for (const cat of categories) {
    for (const [parent, subcats] of Object.entries(CATEGORY_TAXONOMY)) {
      if (subcats.includes(cat)) parents.add(parent);
    }
  }
  return [...parents];
}

export function getCategoryOverlap(controversyCategories, brandCategories) {
  const directMatches = controversyCategories.filter(c => brandCategories.includes(c));

  const cParents = deriveParentCategories(controversyCategories);
  const bParents = deriveParentCategories(brandCategories);
  const sharedParents = cParents.filter(p => bParents.includes(p));

  return { directMatches, sharedParents };
}

export function getMatchLevel(controversyCategories, brandCategories) {
  const { directMatches, sharedParents } = getCategoryOverlap(controversyCategories, brandCategories);
  if (directMatches.length > 0) return 'direct';
  if (sharedParents.length > 0) return 'parent';
  return null;
}

export { CATEGORY_TAXONOMY };
