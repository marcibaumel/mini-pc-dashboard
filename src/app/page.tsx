import { StorageDashboard } from "@/components/StorageDashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <StorageDashboard />
      </main>
    </div>
  );
}
