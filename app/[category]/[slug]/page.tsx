import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoryDetail from "../../components/StoryDetail";
import {
  archiveCategoryPaths,
  archiveItems,
  getArchiveItemByRoute,
} from "../../data/archiveItems";
import { getArchiveDetailDescription } from "../../data/archivePresentation";

type StoryPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return archiveItems.map((item) => ({
    category: archiveCategoryPaths[item.category],
    slug: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const item = getArchiveItemByRoute(category, slug);

  if (!item) {
    return {};
  }

  return {
    title: `${item.title} | The Archive`,
    description: getArchiveDetailDescription(item),
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { category, slug } = await params;
  const item = getArchiveItemByRoute(category, slug);

  if (!item) {
    notFound();
  }

  return <StoryDetail item={item} />;
}
