/**
 * Computes the dot product of two numerical vectors.
 * Returns 0 if either vector is empty or lengths do not match.
 */
export function dotProduct(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    if (typeof a !== 'number' || typeof b !== 'number' || !isFinite(a) || !isFinite(b)) {
      return 0;
    }
    dot += a * b;
  }

  return isFinite(dot) ? dot : 0;
}

/**
 * Computes the Euclidean norm (L2 magnitude) of a vector.
 */
export function vectorNorm(vec: number[]): number {
  if (!vec || vec.length === 0) return 0;

  let sumSquares = 0;
  for (let i = 0; i < vec.length; i++) {
    const val = vec[i];
    if (typeof val !== 'number' || !isFinite(val)) return 0;
    sumSquares += val * val;
  }

  const norm = Math.sqrt(sumSquares);
  return isFinite(norm) ? norm : 0;
}

/**
 * Calculates numerically stable cosine similarity between two dense vectors.
 *
 * Guarantees:
 * 1. Safe on empty / null / undefined vectors (returns 0).
 * 2. Safe on mismatched vector dimensions (returns 0).
 * 3. Safe on zero-magnitude vectors (returns 0).
 * 4. Safe against NaN / Infinity inputs (returns 0).
 * 5. Clamps result strictly within [-1.0, 1.0] to prevent floating point overshoot.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dot = 0;
  let sumSqA = 0;
  let sumSqB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];

    if (
      typeof a !== 'number' ||
      typeof b !== 'number' ||
      !isFinite(a) ||
      !isFinite(b) ||
      isNaN(a) ||
      isNaN(b)
    ) {
      return 0;
    }

    dot += a * b;
    sumSqA += a * a;
    sumSqB += b * b;
  }

  if (sumSqA <= 0 || sumSqB <= 0) {
    return 0;
  }

  const normA = Math.sqrt(sumSqA);
  const normB = Math.sqrt(sumSqB);

  if (!isFinite(normA) || !isFinite(normB) || normA === 0 || normB === 0) {
    return 0;
  }

  const sim = dot / (normA * normB);

  if (isNaN(sim) || !isFinite(sim)) {
    return 0;
  }

  // Clamp within [-1.0, 1.0] to correct floating point inaccuracies
  return Math.max(-1.0, Math.min(1.0, sim));
}
