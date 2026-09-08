import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Entrar</h1>
      <Card>
        <LoginForm />
      </Card>
      <p className="mt-4 text-center text-sm text-zinc-500">
        Esqueceu a senha?{" "}
        <Link
          href="/recuperar-senha"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Recuperar
        </Link>{" "}
        · Ainda não tem conta?{" "}
        <Link
          href="/register"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Criar conta grátis
        </Link>
      </p>
    </main>
  );
}