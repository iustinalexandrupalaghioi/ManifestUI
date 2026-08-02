import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/framework/components/ui/card";

export default function Page() {
  return (
    <div className="mx-auto my-10 flex max-w-96 flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>Confirm your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a confirmation link to your email. Click it to
            activate your account, then come back and log in.
          </p>
          <Link
            href="/auth/login"
            className="text-sm underline underline-offset-4"
          >
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
