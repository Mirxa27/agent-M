import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { CredentialList } from "@/components/credentials";
import DashboardLayout from "@/components/layouts/dashboard-layout";

export default function CredentialsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Credentials"
      subtitle="Securely store and manage your credentials for AI services"
    >
      <CredentialList />
    </DashboardLayout>
  );
}
