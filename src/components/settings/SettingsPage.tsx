import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { DeleteAccountSection } from "./DeleteAccountSection";

/**
 * Settings page component
 * Displays tabs for password change and account deletion
 */
export function SettingsPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ustawienia konta</h1>
        <p className="text-muted-foreground">Zarządzaj swoim kontem i preferencjami</p>
      </div>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">Zmiana hasła</TabsTrigger>
          <TabsTrigger value="delete">Usunięcie konta</TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="mt-6">
          <ChangePasswordForm />
        </TabsContent>

        <TabsContent value="delete" className="mt-6">
          <DeleteAccountSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
