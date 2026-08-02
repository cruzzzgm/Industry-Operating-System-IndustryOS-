import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { TrashBin } from "@/components/TrashBin";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 flex items-center justify-between px-4 bg-[hsl(240,10%,5%)] md:px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <TrashBin />
              <NotificationCenter />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-zinc-50 text-foreground dark:bg-background">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
