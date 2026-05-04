import { getAllSettings, SETTING_KEYS } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();
  return (
    <div className="container-x py-10 max-w-3xl">
      <h1 className="text-3xl font-serif text-navy-800">Site settings</h1>
      <p className="text-navy-600">All values below are editable and read by the public site at request time.</p>
      <SettingsForm
        initial={{
          businessName: settings[SETTING_KEYS.businessName],
          phone: settings[SETTING_KEYS.phone],
          email: settings[SETTING_KEYS.email],
          address: settings[SETTING_KEYS.address],
          instagramUrl: settings[SETTING_KEYS.instagramUrl],
          facebookUrl: settings[SETTING_KEYS.facebookUrl],
          tiktokUrl: settings[SETTING_KEYS.tiktokUrl],
          calendlyUrl: settings[SETTING_KEYS.calendlyUrl],
          depositPercent: settings[SETTING_KEYS.depositPercent],
          instantReservationsEnabled: settings[SETTING_KEYS.instantReservationsEnabled] === "true",
          paymentMethodsText: settings[SETTING_KEYS.paymentMethodsText],
          licensedInsuredText: settings[SETTING_KEYS.licensedInsuredText],
          heroHeadline: settings[SETTING_KEYS.heroHeadline],
          heroSubheadline: settings[SETTING_KEYS.heroSubheadline],
        }}
      />
    </div>
  );
}
