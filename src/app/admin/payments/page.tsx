"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";

interface Payment {
  id: string;
  paid: boolean;
  user: { id: string; name: string | null; email: string };
}

interface DuesPeriod {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: string;
  payments: Payment[];
}

export default function AdminPaymentsPage() {
  const [periods, setPeriods] = useState<DuesPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const { confirm: confirmDialog, dialogProps } = useConfirmDialog();

  useEffect(() => {
    fetch("/api/dues-periods").then((r) => r.json()).then((data) => {
      setPeriods(data);
      if (data.length > 0) setSelectedPeriod(data[0].id);
    });
  }, []);

  const togglePayment = async (paymentId: string, currentPaid: boolean) => {
    const res = await fetch(`/api/payments/${paymentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !currentPaid }),
    });
    if (res.ok) {
      setPeriods((prev) =>
        prev.map((p) => ({
          ...p,
          payments: p.payments.map((pay) =>
            pay.id === paymentId ? { ...pay, paid: !currentPaid } : pay
          ),
        }))
      );
      toast.success("Payment updated");
    }
  };

  const deletePeriod = async (id: string) => {
    const ok = await confirmDialog({
      title: "Delete Dues Period",
      description: "Delete this dues period and all its payments?",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/dues-periods/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPeriods((prev) => prev.filter((p) => p.id !== id));
      if (selectedPeriod === id) setSelectedPeriod(periods[0]?.id || null);
      toast.success("Dues period deleted");
    }
  };

  const currentPeriod = periods.find((p) => p.id === selectedPeriod);
  const paidCount = currentPeriod?.payments.filter((p) => p.paid).length || 0;
  const totalCount = currentPeriod?.payments.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dues & Payments</h1>
        <Link href="/admin/payments/new">
          <Button>New Dues Period</Button>
        </Link>
      </div>

      {periods.length === 0 ? (
        <p className="text-muted-foreground">No dues periods created yet.</p>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {periods.map((p) => (
              <Button
                key={p.id}
                variant={selectedPeriod === p.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(p.id)}
              >
                {p.name}
              </Button>
            ))}
          </div>

          {currentPeriod && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{currentPeriod.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    ${currentPeriod.amount} — Due {new Date(currentPeriod.dueDate).toLocaleDateString()}
                    <Badge variant="secondary" className="ml-2">{currentPeriod.frequency}</Badge>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{paidCount}/{totalCount}</p>
                  <p className="text-xs text-muted-foreground">paid</p>
                  <Button variant="destructive" size="sm" className="mt-2" onClick={() => deletePeriod(currentPeriod.id)}>Delete</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPeriod.payments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>{payment.user.name || payment.user.email}</TableCell>
                        <TableCell>
                          <Badge variant={payment.paid ? "default" : "secondary"}>
                            {payment.paid ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={payment.paid}
                            onCheckedChange={() => togglePayment(payment.id, payment.paid)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
