import { SettingsForm } from "@/components/settings/settings-form";
import { meta } from "@/lib/data";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Your profile, attendance rules, and notifications. {meta.term}.</p>
      </header>

      <SettingsForm />
    </div>
  );
}
