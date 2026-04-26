import GardenScene from "@/components/jardim/GardenScene";

export default function JardimPage() {
  return (
    <main className="fixed inset-0 w-full overflow-hidden bg-[#dff3ff]">
      <div className="h-[100dvh] w-full pb-[calc(72px+env(safe-area-inset-bottom))]">
        <GardenScene />
      </div>
    </main>
  );
}