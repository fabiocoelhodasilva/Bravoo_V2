import VirtudeDetalhes from "@/components/virtudes/VirtudeDetalhes";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VirtudePage({
  params,
}: PageProps) {
  const { id } = await params;

  return <VirtudeDetalhes virtudeId={id} />;
}