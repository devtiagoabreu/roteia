import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card } from "@/components/ui";

export const metadata = { title: "Perfil · Roteia" };

export default async function PerfilPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-sm text-zinc-500">
          Preferências do seu dia e da conta.
        </p>
      </div>

      <Card className="p-5">
        <ProfileForm
          user={{
            name: user.name,
            email: user.email,
            timezone: user.tenant.timezone,
            profileType: user.tenant.profileType ?? "PESSOAL",
            transportMode: user.tenant.transportMode,
          }}
          companyName={user.tenant.name}
        />
      </Card>
    </main>
  );
}