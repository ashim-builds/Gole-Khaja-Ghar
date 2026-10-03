// Search & Fuzzy Matching Utility for Gole Khaja Ghar
// Handles prefixes, typos, acronyms (c.momo -> Chicken Momo), multi-token out-of-order search, and subsequences.

export interface SearchableItem {
  name: string;
  category?: string;
  description?: string;
  slug?: string;
  [key: string]: any;
}

export interface SearchResult<T> {
  item: T;
  score: number;
}

/**
 * Standardize text: lowercased, normalized whitespace
 */
export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Levenshtein distance calculation for typo tolerance
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Checks if chars of needle appear in haystack in order (subsequence)
 */
export function isSubsequence(needle: string, haystack: string): boolean {
  let nIdx = 0;
  let hIdx = 0;
  while (nIdx < needle.length && hIdx < haystack.length) {
    if (needle[nIdx] === haystack[hIdx]) {
      nIdx++;
    }
    hIdx++;
  }
  return nIdx === needle.length;
}

/**
 * Check abbreviation / acronym matches
 * Examples:
 * - "c.momo" or "c momo" -> ["c", "momo"] against ["chicken", "momo"] => true
 * - "cmomo" -> "c" + "momo" against ["chicken", "momo"] => true
 * - "cfm" -> "c", "f", "m" against ["chicken", "fried", "momo"] => true
 */
export function matchAbbreviation(query: string, targetWords: string[]): boolean {
  if (!query || targetWords.length === 0) return false;
  
  // Clean query of dots, hyphens, slashes
  const cleanTokens = query
    .replace(/[.\-_/]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  // 1. Acronym Initials: e.g. "cfm" or "cm" matching initials of ["chicken", "fried", "momo"]
  const initials = targetWords.map((w) => w[0] || '').join('');
  const rawQuery = query.replace(/[^a-z0-9]/g, '');
  if (rawQuery.length >= 2 && initials.startsWith(rawQuery)) {
    return true;
  }

  // 2. Token abbreviation: e.g. ["c", "momo"] matching ["chicken", "momo"]
  if (cleanTokens.length > 1 && cleanTokens.length <= targetWords.length) {
    let matchedAll = true;
    for (let i = 0; i < cleanTokens.length; i++) {
      const qToken = cleanTokens[i];
      const tWord = targetWords[i];
      if (!tWord || !tWord.startsWith(qToken)) {
        matchedAll = false;
        break;
      }
    }
    if (matchedAll) return true;
  }

  // 3. Compact abbreviation like "cmomo" or "bmomo" or "cchowmein"
  if (rawQuery.length >= 3 && targetWords.length >= 2) {
    const firstChar = rawQuery[0];
    const restQuery = rawQuery.slice(1);
    if (targetWords[0].startsWith(firstChar)) {
      const restTarget = targetWords.slice(1).join('');
      if (restTarget.startsWith(restQuery) || targetWords[1].startsWith(restQuery)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Compute relevance score for a product against a search query.
 * Higher score = better match. 0 = no match.
 */
export function scoreMatch(
  query: string,
  target: { name: string; category?: string; description?: string; slug?: string }
): number {
  const q = normalizeText(query);
  if (!q) return 100;

  const name = normalizeText(target.name);
  const category = normalizeText(target.category || '');
  const description = normalizeText(target.description || '');
  const slug = normalizeText(target.slug || '');

  // 1. Exact Match
  if (name === q) return 1000;
  if (slug === q) return 980;

  // 2. Direct Starts With
  if (name.startsWith(q)) return 900;

  // Split name into words & query into tokens
  const nameWords = name.split(/\s+/).filter(Boolean);
  const queryTokens = q.split(/\s+/).filter(Boolean);

  // 3. Any word in name starts with full query (e.g. "momo" in "Chicken Momo")
  const anyWordStartsWith = nameWords.some((w) => w.startsWith(q));
  if (anyWordStartsWith) {
    return 800;
  }

  // 4. Substring in name
  if (name.includes(q)) {
    return 750;
  }

  // 5. Abbreviation / Dot Acronym Match (e.g. "c.momo", "c momo", "cmomo", "cfm")
  if (matchAbbreviation(q, nameWords)) {
    return 700;
  }

  // 6. Multi-token match (all query tokens match some word prefix or substring)
  if (queryTokens.length > 1) {
    const allTokensMatch = queryTokens.every((token) =>
      nameWords.some((word) => word.startsWith(token) || word.includes(token))
    );
    if (allTokensMatch) {
      return 650;
    }
  }

  // 7. Subsequence matching across whole name (e.g. "chkn" -> "chicken", "sekw" -> "sekuwa")
  const compactName = name.replace(/\s+/g, '');
  const compactQuery = q.replace(/[^a-z0-9]/g, '');
  if (compactQuery.length >= 3 && isSubsequence(compactQuery, compactName)) {
    const coverageRatio = compactQuery.length / compactName.length;
    return 500 + Math.round(coverageRatio * 100);
  }

  // 8. Typo / Levenshtein distance on individual words (e.g. "coce" -> "coke", "papsi" -> "pepsi", "chiken" -> "chicken")
  for (const qTok of queryTokens) {
    if (qTok.length >= 3) {
      for (const w of nameWords) {
        if (w.length >= 3) {
          const maxDist = qTok.length <= 4 ? 1 : 2;
          const dist = levenshteinDistance(qTok, w);
          if (dist <= maxDist) {
            return 450 - dist * 50;
          }
        }
      }
    }
  }

  // 9. Match Category
  if (category && (category === q || category.startsWith(q) || category.includes(q))) {
    return 350;
  }

  // 10. Match Description
  if (description && description.includes(q)) {
    return 200;
  }

  return 0;
}

/**
 * Filter and sort a list of items using smart fuzzy and acronym matching
 */
export function searchItems<T extends SearchableItem>(
  items: T[],
  query: string,
  getFields?: (item: T) => { name: string; category?: string; description?: string; slug?: string }
): T[] {
  if (!query || !query.trim()) return items;

  const scored: SearchResult<T>[] = [];

  for (const item of items) {
    const fields = getFields
      ? getFields(item)
      : {
          name: item.name,
          category: item.category,
          description: item.description,
          slug: item.slug,
        };

    const score = scoreMatch(query, fields);
    if (score > 0) {
      scored.push({ item, score });
    }
  }

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.item);
}
