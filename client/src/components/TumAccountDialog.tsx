import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TumAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
}

const TUM_FACULTIES = [
  "Architecture",
  "Civil, Geo and Environmental Engineering",
  "Electrical and Computer Engineering",
  "Informatics",
  "Mathematics",
  "Mechanical Engineering",
  "Medicine",
  "Physics",
  "Sport and Health Sciences",
  "TUM School of Management",
  "Other",
];

export default function TumAccountDialog({
  open,
  onOpenChange,
  onVerified,
}: TumAccountDialogProps) {
  const [step, setStep] = useState<"info" | "verify">("info");
  const [formData, setFormData] = useState({
    tumEmail: "",
    studentId: "",
    firstName: "",
    lastName: "",
    faculty: "",
  });
  const [verificationCode, setVerificationCode] = useState("");

  const requestMutation = trpc.tumAccount.requestVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification code sent to your TUM email!");
      setStep("verify");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyMutation = trpc.tumAccount.verify.useMutation({
    onSuccess: () => {
      toast.success("TUM account verified successfully!");
      onVerified?.();
      onOpenChange(false);
      // Reset form
      setStep("info");
      setFormData({
        tumEmail: "",
        studentId: "",
        firstName: "",
        lastName: "",
        faculty: "",
      });
      setVerificationCode("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleRequestVerification = () => {
    if (!formData.tumEmail || !formData.studentId) {
      toast.error("Please fill in all required fields");
      return;
    }
    requestMutation.mutate(formData);
  };

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit verification code");
      return;
    }
    verifyMutation.mutate({ code: verificationCode });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "info" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Link Your TUM Account
              </DialogTitle>
              <DialogDescription>
                Connect your TUM student account to access personalized features and course
                schedule integration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tumEmail">
                  TUM Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tumEmail"
                  type="email"
                  placeholder="firstname.lastname@tum.de"
                  value={formData.tumEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, tumEmail: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Use your @tum.de or @mytum.de email address
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">
                  Student ID (Matrikelnummer) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="studentId"
                  placeholder="e.g., 03123456"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Max"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Mustermann"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty</Label>
                <Select
                  value={formData.faculty}
                  onValueChange={(value) =>
                    setFormData({ ...formData, faculty: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {TUM_FACULTIES.map((faculty) => (
                      <SelectItem key={faculty} value={faculty}>
                        {faculty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleRequestVerification}
                disabled={requestMutation.isPending}
                className="w-full"
              >
                {requestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Verify Your Email
              </DialogTitle>
              <DialogDescription>
                We've sent a 6-digit verification code to{" "}
                <span className="font-semibold">{formData.tumEmail}</span>. Please check your
                inbox and enter the code below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="123456"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  The code will expire in 15 minutes
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleVerify}
                disabled={verifyMutation.isPending}
                className="w-full"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep("info")}
                className="w-full"
              >
                Back
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
