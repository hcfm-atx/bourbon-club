"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { DollarSign, Receipt } from "lucide-react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string | null;
  notes: string | null;
  recordedBy: { id: string; name: string | null; email: string };
}

interface TreasuryData {
  totalCollected: number;
  totalExpenses: number;
  balance: number;
  recentExpenses: Expense[];
}

const CATEGORIES = [
  { value: "BOURBON_PURCHASE", label: "Bourbon Purchase" },
  { value: "VENUE", label: "Venue" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "FOOD_DRINK", label: "Food & Drink" },
  { value: "OTHER", label: "Other" },
];

function categoryLabel(value: string | null) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value ?? "—";
}

export default function AdminTreasuryPage() {
  const [treasury, setTreasury] = useState<TreasuryData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const { confirm: confirmDialog, dialogProps } = useConfirmDialog();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<string>("");
  const [notes, setNotes] = useState("");

  const fetchData = () => {
    fetch("/api/treasury").then((r) => r.json()).then(setTreasury);
    fetch("/api/expenses").then((r) => r.json()).then(setExpenses);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setDescription("");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setCategory("");
    setNotes("");
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setDate(expense.date.slice(0, 10));
    setCategory(expense.category ?? "");
    setNotes(expense.notes ?? "");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const body = {
      description,
      amount: parseFloat(amount),
      date,
      category: category || null,
      notes: notes || null,
    };

    if (editing) {
      const res = await fetch(`/api/expenses/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Expense updated");
        setDialogOpen(false);
        fetchData();
      } else {
        toast.error("Failed to update expense");
      }
    } else {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Expense added");
        setDialogOpen(false);
        fetchData();
      } else {
        toast.error("Failed to add expense");
      }
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: "Delete Expense",
      description: "Delete this expense?",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Expense deleted");
      fetchData();
    } else {
      toast.error("Failed to delete expense");
    }
  };

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Treasury</h1>
        <Button onClick={openAdd}>Add Expense</Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-600">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{treasury ? fmt(treasury.totalCollected) : "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{treasury ? fmt(treasury.totalExpenses) : "—"}</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${treasury && treasury.balance >= 0 ? "border-l-green-600" : "border-l-red-500"}`}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${treasury && treasury.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {treasury ? fmt(treasury.balance) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses ({expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-muted-foreground">No expenses recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {expense.description}
                      {expense.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">{expense.notes}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {expense.category && <Badge variant="outline">{categoryLabel(expense.category)}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{fmt(expense.amount)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(expense)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(expense.id)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Blanton's bottle for tasting" />
            </div>
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input id="amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!description || !amount}>
              {editing ? "Update" : "Add"} Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
