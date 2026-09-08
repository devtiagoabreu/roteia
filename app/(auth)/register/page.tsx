import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Card } from "@/components/ui";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">Criar conta</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Comece grátis e organize seu primeiro dia em minutos.
      </p>
      <Card>
        <RegisterForm />
      </Card>
      <p className="mt-4 text-center text-sm text-zinc-500">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Entrar
        </Link>
      </p>
    </main>
  );
}