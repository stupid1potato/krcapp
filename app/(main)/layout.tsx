import { BottomNav } from "@/components/BottomNav";
import { NoticePopup } from "@/components/NoticePopup";
import { TopBar } from "@/components/TopBar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full min-w-0 max-w-[430px] flex-col overflow-x-clip bg-white">
      <TopBar />
      <main className="min-w-0 flex-1 pb-24">{children}</main>
      <BottomNav />
      <NoticePopup />
    </div>
  );
}
