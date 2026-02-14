"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DuesPeriod {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: string;
  payments: {
    id: string;
    paid: boolean;
    paidAt: string | null;
    user: { id: string };
  }[];
}

interface AppSettings {
  venmoHandle: string | null;
  paypalEmail: string | null;
}

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [periods, setPeriods] = useState<DuesPeriod[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ venmoHandle: null, paypalEmail: null });

  useEffect(() => {
    fetch("/api/dues-periods").then((r) => r.json()).then(setPeriods);
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
  }, []);

  const myPayments = periods.map((period) => {
    const payment = period.payments.find((p) => p.user.id === session?.user?.id);
    return { period, payment };
  });

  const venmoUrl = settings.venmoHandle
    ? (amount: number) =>
        `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(settings.venmoHandle!)}&amount=${amount}&note=${encodeURIComponent("Bourbon Club Dues")}`
    : null;

  const paypalUrl = settings.paypalEmail
    ? (amount: number) =>
        `https://paypal.me/${settings.paypalEmail}/${amount}`
    : null;

  const unpaid = myPayments.filter(({ payment }) => !payment?.paid);
  const totalUnpaid = unpaid.reduce((sum, { period }) => sum + period.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payments</h1>

      {unpaid.length > 0 && (
        <Card className="border-l-4 border-l-amber-600 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding Balance</p>
                <p className="text-2xl font-bold">${totalUnpaid.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{unpaid.length} unpaid {unpaid.length === 1 ? "period" : "periods"}</p>
              </div>
              <Badge variant="secondary" className="text-amber-700 dark:text-amber-400">Action Needed</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Dues</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myPayments.map(({ period, payment }) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">{period.name}</TableCell>
                  <TableCell>${period.amount.toFixed(2)}</TableCell>
                  <TableCell>{new Date(period.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={payment?.paid ? "default" : "secondary"}>
                      {payment?.paid ? "Paid" : "Unpaid"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!payment?.paid && (
                      <div className="flex gap-2">
                        {venmoUrl && (
                          <a href={venmoUrl(period.amount)} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">Venmo</Button>
                          </a>
                        )}
                        {paypalUrl && (
                          <a href={paypalUrl(period.amount)} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">PayPal</Button>
                          </a>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {myPayments.length === 0 && <p className="text-muted-foreground mt-4">No dues periods.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
