import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoryDetail from "../../components/StoryDetail";
import { getArchiveDetailDescription } from "../../data/archivePresentation";
import { getEntryBySlug } from "../../lib/archiveRepository";
import { getStaticArchiveParams } from "../../lib/staticArchiveRepository";

type StoryPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticArchiveParams();
}

export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const item = getEntryBySlug(category, slug);

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
  const item = getEntryBySlug(category, slug);

  if (!item) {
    notFound();
  }

  return <StoryDetail item={item} />;
}
