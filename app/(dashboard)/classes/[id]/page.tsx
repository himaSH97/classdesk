import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PagePlaceholderSkeleton } from "@/components/dashboard/page-placeholder";
import { ClassProfileView } from "@/components/classes/class-profile";
import { classes, getClassProfile } from "@/lib/data";

// One static page per class.
export function generateStaticParams() {
  return classes.map((c) => ({ id: c.id }));
}

// Reading `params` happens below a <Suspense> boundary (required with Cache Components).
export default function ClassPage(props: PageProps<"/classes/[id]">) {
  return (
    <Suspense fallback={<PagePlaceholderSkeleton />}>
      <ClassContent params={props.params} />
    </Suspense>
  );
}

async function ClassContent({ params }: { params: PageProps<"/classes/[id]">["params"] }) {
  const { id } = await params;
  const profile = getClassProfile(id);
  if (!profile) notFound();
  return <ClassProfileView profile={profile} />;
}
