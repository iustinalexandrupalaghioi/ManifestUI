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
import { cn } from "@/lib/utils";
import { updatePassword } from "./actions/update-password";
import { FormPasswordInput } from "@/framework/components/form/form-fields/FormPasswordInput";

const formSchema = z
  .object({
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

type FormSchema = z.infer<typeof formSchema>;

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (values: FormSchema) => {
    setError(null);
    startTransition(async () => {
      const result = await updatePassword(values.password);
      if (result && !result.ok) setError(result.error.message);
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
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              Please enter and confirm your new password below.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormPasswordInput<FormSchema>
                name="password"
                label="New password"
                placeholder="••••••••••••"
              />
              <FormPasswordInput<FormSchema>
                name="confirmPassword"
                label="Confirm password"
                placeholder="••••••••••••"
              />

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Saving..." : "Save new password"}
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
