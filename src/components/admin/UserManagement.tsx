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
import { User, DollarSign, Ban, Plus, Minus, Trash2 } from "lucide-react";

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceField, setBalanceField] = useState<"total_traced" | "amount_freed_pending" | "refund_ready">("total_traced");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          balances (*)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load users: " + error.message,
        });
        return;
      }

      if (data) {
        setUsers(data);
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
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

      const currentValue = parseFloat(String(currentBalance[balanceField] || "0"));
      const newAmount = type === "add" ? currentValue + numAmount : currentValue - numAmount;

      // Update balance
      const { error: balanceError } = await supabase
        .from("balances")
        .update({ [balanceField]: newAmount })
        .eq("user_id", selectedUser.id);

      if (balanceError) throw balanceError;

      // Log transaction
      await supabase.from("transactions").insert({
        user_id: selectedUser.id,
        type: "adjustment",
        amount: type === "add" ? numAmount : -numAmount,
        memo: `${balanceField}: ${reason}`,
      });

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: admin?.id,
        action_type: type === "add" ? "add_balance" : "reduce_balance",
        target_user_id: selectedUser.id,
        reason: `${balanceField}: ${reason}`,
        delta_amount: numAmount,
      });

      toast({
        title: "Balance updated",
        description: `Successfully ${type === "add" ? "added" : "reduced"} $${numAmount} to ${balanceField.replace(/_/g, ' ')}`,
      });

      setSelectedUser(null);
      setAmount("");
      setReason("");
      setBalanceField("total_traced");
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
        action_type: ban ? "ban_user" : "unban_user",
        target_user_id: userId,
        reason: ban ? "User restricted" : "User unrestricted",
      });

      toast({
        title: ban ? "User restricted" : "User unrestricted",
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

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const { data: { user: admin } } = await supabase.auth.getUser();

      // Delete user profile (cascades to related records)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", selectedUser.id);

      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: admin?.id,
        action_type: "delete_user",
        target_user_id: selectedUser.id,
        reason: "User deleted by admin",
      });

      toast({
        title: "User deleted",
        description: "User and all related data removed",
      });

      setDeleteDialogOpen(false);
      setSelectedUser(null);
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
                  {user.banned && <Badge variant="destructive">Restricted</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {user.full_name || "No name provided"}
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Traced: </span>
                    <span className="font-medium">${parseFloat(user.balances?.[0]?.total_traced || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Freed (Pending): </span>
                    <span className="font-medium">${parseFloat(user.balances?.[0]?.amount_freed_pending || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ready: </span>
                    <span className="font-medium">${parseFloat(user.balances?.[0]?.refund_ready || 0).toLocaleString()}</span>
                  </div>
                </div>
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
                      <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted p-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Traced</p>
                          <p className="font-bold">${parseFloat(user.balances?.[0]?.total_traced || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Freed (Pending)</p>
                          <p className="font-bold">${parseFloat(user.balances?.[0]?.amount_freed_pending || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ready</p>
                          <p className="font-bold">${parseFloat(user.balances?.[0]?.refund_ready || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field">Balance Field</Label>
                        <select
                          id="field"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={balanceField}
                          onChange={(e) => setBalanceField(e.target.value as any)}
                        >
                          <option value="total_traced">Total Traced</option>
                          <option value="amount_freed_pending">Amount Freed (Pending)</option>
                          <option value="refund_ready">Ready for Withdrawal</option>
                        </select>
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
                  variant={user.banned ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => handleBanUser(user.id, !user.banned)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  {user.banned ? "Unrestrict" : "Restrict"}
                </Button>
                <AlertDialog open={deleteDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                  setDeleteDialogOpen(open);
                  if (!open) setSelectedUser(null);
                }}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {user.email}? This will permanently remove the user and all their data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete User
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
