import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            A sign-in link has been sent to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground text-sm">
            Click the link in the email to sign in. If you don&apos;t see it, check your spam folder.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
