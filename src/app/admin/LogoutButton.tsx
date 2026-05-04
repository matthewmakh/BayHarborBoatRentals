"use client";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }
  return (
    <button onClick={logout} className="text-navy-600 hover:text-navy-800">
      Sign out
    </button>
  );
}
