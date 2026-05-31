import { DealLockCard } from "@/components/ui/DealLockCard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DealLockPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="min-h-dvh bg-[var(--bg-base)] flex items-center justify-center p-4">
      <DealLockCard dealId={id} />
    </div>
  );
}
