import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ id }) => id !== 'index.md');

  const items = posts
    .filter((p) => p.data.date)
    .sort((a, b) => new Date(b.data.date!).getTime() - new Date(a.data.date!).getTime())
    .map((post) => ({
      title: post.data.title,
      description: post.data.description ?? '',
      pubDate: new Date(post.data.date!),
      link: `/posts/${post.id.replace(/\.md$/i, '')}/`,
    }));

  return rss({
    title: 'Interneto – Posts',
    description: 'Articles, comparisons, guides, and essays from Interneto.',
    site: context.site!,
    items,
    customData: '<language>en</language>',
  });
}
