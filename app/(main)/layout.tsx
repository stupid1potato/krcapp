import { BottomNav } from "@/components/BottomNav";
import { NoticePopup } from "@/components/NoticePopup";
import { TopBar } from "@/components/TopBar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-white">
      <TopBar />
      <main className="pb-24">{children}</main>
      <BottomNav />
      <NoticePopup />
    </div>
  );
}
