import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCircle, XCircle, Clock } from "lucide-react";

interface NotificationsListProps {
  userId: string;
}

const NotificationsList = ({ userId }: NotificationsListProps) => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    fetchWithdrawals();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("withdrawal-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawal_requests",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setWithdrawals(data);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      processing: "default",
      completed: "default",
    };

    return (
      <Badge variant={variants[status] || "secondary"} className="text-xs">
        {status}
      </Badge>
    );
  };

  if (withdrawals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No notifications yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {withdrawals.map((withdrawal) => (
          <div
            key={withdrawal.id}
            className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-muted/50"
          >
            <div className="mt-0.5">{getStatusIcon(withdrawal.status)}</div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Withdrawal Request - ${parseFloat(withdrawal.amount).toLocaleString()}
                </p>
                {getStatusBadge(withdrawal.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                Network: {withdrawal.network}
              </p>
              {withdrawal.admin_reason && (
                <p className="text-xs text-muted-foreground italic">
                  {withdrawal.admin_reason}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(withdrawal.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default NotificationsList;
