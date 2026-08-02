"use client";

import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/framework/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/framework/components/ui/card";

import { cn } from "@/lib/utils";
import { signup } from "./actions/signup";
import { loginWithGoogle } from "./actions/login-with-google";
import { FormInput } from "@/framework/components/form/form-fields/FormInput";
import { FormPasswordInput } from "@/framework/components/form/form-fields/FormPasswordInput";

const signUpSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: SignUpFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await signup(
        values.fullName,
        values.email,
        values.password,
      );
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.push("/auth/signup-success");
    });
  };

  return (
    <div
      className={cn("flex flex-col gap-6 max-w-96 mx-auto my-10", className)}
      {...props}
    >
      <Card>
        <CardHeader className="flex flex-col-reverse md:flex-row items-start justify-between md:items-center gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle>Sign up with a new account</CardTitle>
            <CardDescription>
              Create your account by filling in the details below.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <FormInput<SignUpFormValues>
                name="fullName"
                label="Full name"
                placeholder="e.g. John Doe"
              />
              <FormInput<SignUpFormValues>
                name="email"
                label="Email"
                type="email"
                placeholder="e.g. john.doe@example.com"
              />
              <FormPasswordInput<SignUpFormValues>
                name="password"
                label="Password"
                placeholder="••••••••••••"
              />
              <FormPasswordInput<SignUpFormValues>
                name="confirmPassword"
                label="Confirm password"
                placeholder="••••••••••••"
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating account..." : "Sign up"}
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
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  Login
                </Link>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
