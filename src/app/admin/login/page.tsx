import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");
  return (
    <main className="min-h-screen flex items-center justify-center bg-navy-900 text-white p-6">
      <div className="w-full max-w-md rounded-2xl bg-white text-navy-900 shadow-xl p-8">
        <h1 className="text-2xl font-serif text-navy-800">Admin sign in</h1>
        <p className="mt-1 text-sm text-navy-600">Bay Harbor Boat Rentals</p>
        <LoginForm error={searchParams.error} next={searchParams.next} />
      </div>
    </main>
  );
}
