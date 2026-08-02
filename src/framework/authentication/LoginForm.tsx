"use client";

import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/framework/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/framework/components/ui/card";

import { cn } from "@/lib/utils";
import { login } from "./actions/login";
import { loginWithGoogle } from "./actions/login-with-google";
import { FormPasswordInput } from "@/framework/components/form/form-fields/FormPasswordInput";
import { FormInput } from "@/framework/components/form/form-fields/FormInput";

const loginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await login(values.email, values.password, next);
      if (result && !result.ok) setError(result.error.message);
    });
  };

  return (
    <div
      className={cn("flex flex-col gap-6 min-w-96 mx-auto my-10", className)}
      {...props}
    >
      <Card>
        <CardHeader className="flex flex-col-reverse md:flex-row items-start justify-between md:items-center gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Please enter your email to access your account.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <FormInput<LoginFormValues>
                name="email"
                label="Email"
                type="email"
                placeholder="john.doe@example.com"
              />

              <div>
                <div className="flex items-center">
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <FormPasswordInput<LoginFormValues>
                  name="password"
                  label="Password"
                  placeholder="••••••••••••"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Logging in..." : "Login"}
              </Button>

              <div className="flex items-center gap-2 text-sm">
                <div className="h-px flex-1 bg-border" />
                <span className="text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full hover:bg-muted"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await loginWithGoogle();
                  })
                }
              >
                <img className="h-4 w-4" src="/google-icon-logo.svg" alt="" />
                Continue with Google
              </Button>

              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="underline underline-offset-4"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
