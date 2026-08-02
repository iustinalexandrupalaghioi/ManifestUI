"use client";

import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/framework/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/framework/components/ui/card";
import { FormInput } from "@/framework/components/form/form-fields/FormInput";
import { cn } from "@/lib/utils";
import { forgotPassword } from "./actions/forgot-password";

const formSchema = z.object({ email: z.email("Please enter a valid email") });
type FormSchema = z.infer<typeof formSchema>;

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: FormSchema) => {
    setError(null);
    startTransition(async () => {
      const result = await forgotPassword(values.email);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSuccess(true);
    });
  };

  if (success) {
    return (
      <div
        className={cn("flex flex-col gap-6 max-w-96 mx-auto my-10", className)}
        {...props}
      >
        <Card>
          <CardHeader className="flex flex-col-reverse md:flex-row items-start justify-between md:items-center gap-2">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>
                Password reset instructions sent
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you registered using your email, you will receive a password
              reset email shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-6 max-w-96 mx-auto my-10", className)}
      {...props}
    >
      <Card>
        <CardHeader className="flex flex-col-reverse md:flex-row items-start justify-between md:items-center gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              Type in your email and we&apos;ll send you a link to reset your
              password
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormInput<FormSchema>
                name="email"
                label="Email"
                type="email"
                placeholder="john.doe@example.com"
              />

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Sending..." : "Send reset email"}
              </Button>

              <div className="mt-4 text-center text-sm">
                Remembered your password?{" "}
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
