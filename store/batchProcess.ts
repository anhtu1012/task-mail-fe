import { PromisePool } from "@supercharge/promise-pool";

/**
 * Split an array into batches and process each batch with controlled concurrency.
 *
 * @param items       - Full array of items to process
 * @param batchSize   - Max items per batch (default: 100)
 * @param concurrency - Max concurrent batches   (default: 3)
 * @param handler     - Function called for each batch; receives the chunk and returns a Promise
 * @returns           - Flattened array of all results from each batch
 *
 * @throws If any batch throws, the first error is rethrown.
 *
 * @example
 * const results = await batchProcess(entries, 100, 3, (chunk) =>
 *   createListContainerExport(chunk),
 * );
 */
export async function batchProcess<TItem, TResult>(
  items: TItem[],
  batchSize: number,
  concurrency: number,
  handler: (batch: TItem[]) => Promise<TResult>,
): Promise<TResult[]> {
  const batches: TItem[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const { results, errors } = await PromisePool.withConcurrency(concurrency)
    .for(batches)
    .process(handler);

  if (errors.length > 0) throw new Error(errors[0].message);

  return results;
}
