"use client";

import { z } from "zod";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { login } from "../actions/login";
import { loginWithGoogle } from "../actions/login-with-google";
import { loginWithGitHub } from "../actions/login-with-github";
import { GithubIcon } from "lucide-react";
import { FormPasswordInput } from "@/framework/components/form/form-fields/FormPasswordInput";
import { FormInput } from "@/framework/components/form/form-fields/FormInput";
import {
  AuthCard,
  AuthDivider,
  authLink,
  authPrimaryButton,
  authSecondaryButton,
} from "./AuthCard";

function makeLoginSchema(t: ReturnType<typeof useTranslations<"AuthForms">>) {
  return z.object({
    email: z
      .string()
      .trim()
      .pipe(z.email(t("validation.invalidEmail"))),
    password: z.string().min(8, t("validation.passwordMinLength")),
    legal: z.boolean().refine((val) => val === true, {
      message: t("validation.mustAcceptTerms"),
    }),
  });
}

type LoginFormValues = z.infer<ReturnType<typeof makeLoginSchema>>;

export function LoginForm(
  props: Omit<React.ComponentPropsWithoutRef<"div">, "title">,
) {
  const t = useTranslations("AuthForms");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loginSchema = useMemo(() => makeLoginSchema(t), [t]);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", legal: false },
  });
  const legalAccepted = form.watch("legal");

  const onSubmit = (values: LoginFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await login(values.email, values.password, next);
      if (result && !result.ok) setError(result.error.message);
    });
  };

  return (
    <AuthCard
      title={t("login.title")}
      description={t("login.description")}
      footer={
        <>
          {t("login.noAccount")}{" "}
          <Link href="/auth/signup" className={authLink}>
            {t("login.signUpLink")}
          </Link>
        </>
      }
      {...props}
    >
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <FormInput<LoginFormValues>
            name="email"
            label={t("login.emailLabel")}
            type="email"
            placeholder={t("login.emailPlaceholder")}
          />

          <div className="flex flex-col gap-2">
            <FormPasswordInput<LoginFormValues>
              name="password"
              label={t("login.passwordLabel")}
              placeholder="••••••••••••"
            />
            <Link
              href="/auth/forgot-password"
              className={`${authLink} self-end text-sm`}
            >
              {t("login.forgotPassword")}
            </Link>
          </div>

          <Controller
            control={form.control}
            name="legal"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="legal"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="legal"
                    className="text-sm leading-snug text-muted-foreground"
                  >
                    {t("legal.agreeTo")}{" "}
                    <Link
                      href="/terms-and-conditions"
                      target="_blank"
                      className="text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      {t("legal.termsAndConditions")}
                    </Link>
                    ,{" "}
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      className="text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      {t("legal.privacyPolicy")}
                    </Link>
                    , {t("legal.and")}{" "}
                    <Link
                      href="/cookie-policy"
                      target="_blank"
                      className="text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      {t("legal.cookiePolicy")}
                    </Link>
                  </label>
                </div>
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            className={authPrimaryButton}
            disabled={!legalAccepted || isPending}
          >
            {isPending ? t("login.submitting") : t("login.submit")}
          </Button>

          <AuthDivider>{t("or")}</AuthDivider>

          <Button
            type="button"
            variant="outline"
            className={authSecondaryButton}
            disabled={!legalAccepted || isPending}
            onClick={() =>
              startTransition(async () => {
                await loginWithGoogle(next);
              })
            }
          >
            <img className="h-4 w-4" src="/google-icon-logo.svg" alt="" />
            {t("continueWithGoogle")}
          </Button>

          <Button
            type="button"
            variant="outline"
            className={authSecondaryButton}
            disabled={!legalAccepted || isPending}
            onClick={() =>
              startTransition(async () => {
                await loginWithGitHub(next);
              })
            }
          >
            <GithubIcon />
            {t("continueWithGitHub")}
          </Button>
        </form>
      </FormProvider>
    </AuthCard>
  );
}
