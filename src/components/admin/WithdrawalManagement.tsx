import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye } from "lucide-react";

interface WithdrawalManagementProps {
  onUpdate: () => void;
}

const WithdrawalManagement = ({ onUpdate }: WithdrawalManagementProps) => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithdrawals();

    const channel = supabase
      .channel("admin-withdrawal-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawal_requests",
        },
        () => {
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from("withdrawal_requests")
      .select(`
        *,
        profiles:user_id (email, full_name)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setWithdrawals(data);
    }
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal || !reason) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a reason",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "approved",
          admin_id: user?.id,
          admin_reason: reason,
        })
        .eq("id", selectedWithdrawal.id);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user?.id,
        action_type: "verify_withdrawal",
        target_user_id: selectedWithdrawal.user_id,
        reason,
        metadata: { withdrawal_id: selectedWithdrawal.id, action: "approved" },
      });

      toast({
        title: "Withdrawal approved",
        description: "The user has been notified",
      });

      setSelectedWithdrawal(null);
      setReason("");
      onUpdate();
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

  const handleReject = async () => {
    if (!selectedWithdrawal || !reason) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a reason",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          admin_id: user?.id,
          admin_reason: reason,
        })
        .eq("id", selectedWithdrawal.id);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user?.id,
        action_type: "verify_withdrawal",
        target_user_id: selectedWithdrawal.user_id,
        reason,
        metadata: { withdrawal_id: selectedWithdrawal.id, action: "rejected" },
      });

      toast({
        title: "Withdrawal rejected",
        description: "The user has been notified",
      });

      setSelectedWithdrawal(null);
      setReason("");
      onUpdate();
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

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{withdrawal.profiles?.email || "Unknown"}</p>
                  <Badge variant={withdrawal.status === "pending" ? "secondary" : "default"}>
                    {withdrawal.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Amount: ${parseFloat(withdrawal.amount).toLocaleString()} • Network: {withdrawal.network}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  {withdrawal.wallet_address}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(withdrawal.created_at).toLocaleString()}
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWithdrawal(withdrawal);
                      setReason("");
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Review Withdrawal Request</DialogTitle>
                    <DialogDescription>
                      Approve or reject this withdrawal request
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>User Email</Label>
                      <p className="text-sm">{withdrawal.profiles?.email}</p>
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <p className="text-sm">${parseFloat(withdrawal.amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Network</Label>
                      <p className="text-sm">{withdrawal.network}</p>
                    </div>
                    <div>
                      <Label>Wallet Address</Label>
                      <p className="text-sm font-mono break-all">{withdrawal.wallet_address}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason (Required)</Label>
                      <Textarea
                        id="reason"
                        placeholder="Enter reason for approval/rejection..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={loading || !reason || withdrawal.status !== "pending"}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={loading || !reason || withdrawal.status !== "pending"}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ))}
          {withdrawals.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No withdrawal requests</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default WithdrawalManagement;
