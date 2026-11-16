import { AuthGate } from "@/components/AuthGate";
import { AuroraBackground } from "@/components/ui/AuroraBackground";

/** Шапка/футер — в корневом layout. Контент кабинета на всю ширину (без max-w-5xl). */
export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div data-ui-floor="app">
        <AuroraBackground intensity="soft">
          <main
            id="main"
            tabIndex={-1}
            className="w-full outline-none pb-[max(0px,env(safe-area-inset-bottom))]"
          >
            {children}
          </main>
        </AuroraBackground>
      </div>
    </AuthGate>
  );
}
