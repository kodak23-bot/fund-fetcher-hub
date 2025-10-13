import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface WithdrawalFormProps {
  userId: string;
  maxAmount: number;
  onSuccess: () => void;
}

const NETWORKS = [
  { value: "ethereum", label: "Ethereum (ERC-20)" },
  { value: "bsc", label: "Binance Smart Chain (BEP-20)" },
  { value: "polygon", label: "Polygon" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "optimism", label: "Optimism" },
];

const WithdrawalForm = ({ userId, maxAmount, onSuccess }: WithdrawalFormProps) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateAddress = (address: string, network: string) => {
    // Basic Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!walletAddress || !network || !amount) {
        throw new Error("All fields are required");
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (numAmount > maxAmount) {
        throw new Error(`Amount cannot exceed available balance of $${maxAmount}`);
      }

      if (!validateAddress(walletAddress, network)) {
        throw new Error("Invalid wallet address format");
      }

      // Submit withdrawal request
      const { error } = await supabase
        .from("withdrawal_requests")
        .insert({
          user_id: userId,
          wallet_address: walletAddress,
          network,
          amount: numAmount,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Withdrawal request submitted",
        description: "Your request is being reviewed by our team",
      });

      // Reset form
      setWalletAddress("");
      setNetwork("");
      setAmount("");
      onSuccess();
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="wallet">Wallet Address</Label>
        <Input
          id="wallet"
          type="text"
          placeholder="0x..."
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">Enter your destination wallet address</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="network">Network</Label>
        <Select value={network} onValueChange={setNetwork} required>
          <SelectTrigger id="network">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {NETWORKS.map((net) => (
              <SelectItem key={net.value} value={net.value}>
                {net.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Make sure the network matches your wallet
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
          max={maxAmount}
          required
        />
        <p className="text-xs text-muted-foreground">
          Available: ${maxAmount.toLocaleString()}
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading || maxAmount <= 0}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Withdrawal Request
      </Button>

      {maxAmount <= 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No funds available for withdrawal at this time
        </p>
      )}
    </form>
  );
};

export default WithdrawalForm;
