"use client";

import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/framework/components/form/form-fields/FormInput";
import { forgotPassword } from "../actions/forgot-password";
import { AuthCard, authLink, authPrimaryButton } from "./AuthCard";

function makeFormSchema(t: ReturnType<typeof useTranslations<"AuthForms">>) {
  return z.object({
    email: z
      .string()
      .trim()
      .pipe(z.email(t("validation.invalidEmail"))),
  });
}

type FormSchema = z.infer<ReturnType<typeof makeFormSchema>>;

export function ForgotPasswordForm(props: Omit<React.ComponentPropsWithoutRef<"div">, "title">) {
  const t = useTranslations("AuthForms");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formSchema = useMemo(() => makeFormSchema(t), [t]);
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

  const backToLogin = (
    <>
      {t("forgotPassword.rememberedPassword")}{" "}
      <Link href="/auth/login" className={authLink}>
        {t("forgotPassword.loginLink")}
      </Link>
    </>
  );

  if (success) {
    return (
      <AuthCard
        title={t("forgotPassword.successTitle")}
        description={t("forgotPassword.successDescription")}
        footer={backToLogin}
        {...props}
      >
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">{t("forgotPassword.successMessage")}</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("forgotPassword.title")}
      description={t("forgotPassword.description")}
      footer={backToLogin}
      {...props}
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormInput<FormSchema>
            name="email"
            label={t("forgotPassword.emailLabel")}
            type="email"
            placeholder={t("forgotPassword.emailPlaceholder")}
          />

          {error && <p className="text-center text-sm text-destructive">{error}</p>}

          <Button type="submit" className={authPrimaryButton} disabled={isPending}>
            {isPending ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
          </Button>
        </form>
      </FormProvider>
    </AuthCard>
  );
}
