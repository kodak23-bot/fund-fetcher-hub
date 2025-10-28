import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { User, DollarSign, Ban, Plus, Minus } from "lucide-react";

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select(`
        *,
        balances (*)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setUsers(data);
    }
  };

  const handleAdjustBalance = async (type: "add" | "reduce") => {
    if (!selectedUser || !amount || !reason) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all fields",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user: admin } } = await supabase.auth.getUser();
      const numAmount = parseFloat(amount);

      // Get current balance
      const { data: currentBalance } = await supabase
        .from("balances")
        .select("*")
        .eq("user_id", selectedUser.id)
        .single();

      if (!currentBalance) throw new Error("Balance not found");

      const currentRefund = parseFloat(String(currentBalance.refund_ready || "0"));
      const newAmount = type === "add" ? currentRefund + numAmount : currentRefund - numAmount;

      // Update balance
      const { error: balanceError } = await supabase
        .from("balances")
        .update({ refund_ready: newAmount })
        .eq("user_id", selectedUser.id);

      if (balanceError) throw balanceError;

      // Log transaction
      await supabase.from("transactions").insert({
        user_id: selectedUser.id,
        type: "adjustment",
        amount: type === "add" ? numAmount : -numAmount,
        memo: reason,
      });

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: admin?.id,
        action_type: type === "add" ? "add_balance" : "reduce_balance",
        target_user_id: selectedUser.id,
        reason,
        delta_amount: numAmount,
      });

      toast({
        title: "Balance updated",
        description: `Successfully ${type === "add" ? "added" : "reduced"} $${numAmount}`,
      });

      setSelectedUser(null);
      setAmount("");
      setReason("");
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      const { data: { user: admin } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("profiles")
        .update({ banned: ban })
        .eq("id", userId);

      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: admin?.id,
        action_type: "ban_user",
        target_user_id: userId,
        reason: ban ? "User banned" : "User unbanned",
      });

      toast({
        title: ban ? "User banned" : "User unbanned",
        description: "User status updated",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.email}</p>
                  {user.banned && <Badge variant="destructive">Banned</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {user.full_name || "No name provided"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Available: ${parseFloat(user.balances?.[0]?.refund_ready || 0).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setAmount("");
                        setReason("");
                      }}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Manage Balance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manage User Balance</DialogTitle>
                      <DialogDescription>{user.email}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Current Balance</Label>
                        <p className="text-2xl font-bold">
                          ${parseFloat(user.balances?.[0]?.refund_ready || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (USD)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason (Required)</Label>
                        <Textarea
                          id="reason"
                          placeholder="Enter reason for adjustment..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleAdjustBalance("reduce")}
                        disabled={loading || !amount || !reason}
                      >
                        <Minus className="mr-2 h-4 w-4" />
                        Reduce
                      </Button>
                      <Button
                        onClick={() => handleAdjustBalance("add")}
                        disabled={loading || !amount || !reason}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button
                  variant={user.banned ? "outline" : "destructive"}
                  size="sm"
                  onClick={() => handleBanUser(user.id, !user.banned)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  {user.banned ? "Unban" : "Ban"}
                </Button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No users found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UserManagement;
