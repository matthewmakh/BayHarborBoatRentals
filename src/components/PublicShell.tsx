import { Header } from "./Header";
import { Footer } from "./Footer";
import { CallbackWidget } from "./CallbackWidget";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CallbackWidget />
    </>
  );
}
