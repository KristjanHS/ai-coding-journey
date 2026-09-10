import { getCollection, type CollectionKey } from 'astro:content';

/**
 * `getStaticPaths` body shared by the entry routes (`atoms/[slug]`,
 * `artifacts/[slug]`, `sidecars/[...slug]`): one page per entry, the
 * collection id as the slug, the entry as the page's only prop.
 */
export async function makeStaticPaths(collection: CollectionKey) {
  const entries = await getCollection(collection);
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
