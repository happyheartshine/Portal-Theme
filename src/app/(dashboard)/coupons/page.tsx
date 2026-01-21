"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { employeeApi, managerApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import { formatUSD } from "@/utils/currency";
import { formatDateDisplay } from "@/utils/datetime";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { CopyIcon, CheckCircleIcon } from "@/icons";

interface Coupon {
  id: string;
  code: string;
  amount: number | string;
  customerName?: string;
  status?: string;
  createdAt?: string;
  usedAt?: string;
}

interface CouponHistory {
  issued: Coupon[];
  honored: Coupon[];
}

interface CouponBalance {
  code?: string;
  balance?: number;
  remainingBalance?: number;
  createdAt?: string;
  issuedAt?: string;
  issuedBy?: { name: string };
  employee?: { name: string };
  status?: string;
}

function CouponsPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "generate");
  const [history, setHistory] = useState<CouponHistory>({ issued: [], honored: [] });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState<Coupon | null>(null);
  const [couponBalance, setCouponBalance] = useState<CouponBalance | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearAmount, setClearAmount] = useState("");
  const [clearing, setClearing] = useState(false);

  const [generateForm, setGenerateForm] = useState({
    customerName: "",
    server: "",
    category: "",
    reason: "",
    zelleName: "",
    amount: "",
  });

  const [balanceCode, setBalanceCode] = useState("");
  const [customerInput, setCustomerInput] = useState("");

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getCouponHistory();
      setHistory(response.data || { issued: [], honored: [] });
    } catch (error: any) {
      toast.error("Failed to load coupon history");
      console.error("Coupon history error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Note: API might need adjustment based on backend expectations
      const response = await employeeApi.generateCoupon({
        amount: parseFloat(generateForm.amount),
        reason: `${generateForm.customerName} - ${generateForm.server} - ${generateForm.category} - ${generateForm.reason} - Zelle: ${generateForm.zelleName}`,
      });
      toast.success("Coupon generated successfully");
      setGeneratedCoupon(response.data);
      setGenerateForm({
        customerName: "",
        server: "",
        category: "",
        reason: "",
        zelleName: "",
        amount: "",
      });
      if (activeTab === "history") {
        fetchHistory();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate coupon");
      console.error("Generate coupon error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckBalance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!balanceCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    try {
      setCheckingBalance(true);
      const response = await managerApi.getCoupon(balanceCode.trim());
      setCouponBalance(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to check coupon balance");
      console.error("Check balance error:", error);
      setCouponBalance(null);
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard");
  };

  const handleSendCoupon = async (code: string) => {
    if (!customerInput.trim()) {
      toast.error("Please enter customer information");
      return;
    }
    try {
      setSubmitting(true);
      await managerApi.sendCoupon(code);
      toast.success("Coupon sent to customer successfully");
      setCustomerInput("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send coupon");
      console.error("Send coupon error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCredit = async (code: string) => {
    if (!customerInput.trim()) {
      toast.error("Please enter customer information");
      return;
    }
    try {
      setSubmitting(true);
      await managerApi.sendCouponCredit(code);
      toast.success("Credit sent to customer successfully");
      setCustomerInput("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send credit");
      console.error("Send credit error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearBalance = async () => {
    if (!couponBalance) return;
    const amount = parseFloat(clearAmount);
    const remaining = parseFloat(
      String(couponBalance.remainingBalance || couponBalance.balance || 0)
    );

    if (isNaN(amount) || amount !== remaining) {
      toast.error(`Amount must equal remaining balance: ${formatUSD(remaining)}`);
      return;
    }

    try {
      setClearing(true);
      const response = await managerApi.clearCouponBalance(balanceCode, amount);
      toast.success(`Already used – at this time by: ${response.data?.usedBy || "Staff"}`);
      setShowClearModal(false);
      setClearAmount("");
      // Refresh balance
      handleCheckBalance({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
      if (activeTab === "history") {
        fetchHistory();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to clear balance");
      console.error("Clear balance error:", error);
    } finally {
      setClearing(false);
    }
  };

  const handleHonor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await employeeApi.honorCoupon(balanceCode);
      toast.success("Coupon honored successfully");
      setBalanceCode("");
      setCouponBalance(null);
      if (activeTab === "history") {
        fetchHistory();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to honor coupon");
      console.error("Honor coupon error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Coupons</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Generate and manage customer coupons
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setActiveTab("generate");
            setGeneratedCoupon(null);
            setCouponBalance(null);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "generate"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Generate
        </button>
        <button
          onClick={() => {
            setActiveTab("balance");
            setGeneratedCoupon(null);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "balance"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Balance
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "history"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          History
        </button>
      </div>

      {/* Generate Tab */}
      {activeTab === "generate" && (
        <div className="space-y-6">
          <ComponentCard title="Generate Coupon">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Customer Name <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={generateForm.customerName}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, customerName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>
                    Server <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={generateForm.server}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, server: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>
                    Category <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={generateForm.category}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, category: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>
                    Zelle Name <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={generateForm.zelleName}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, zelleName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label>
                  Reason <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={generateForm.reason}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, reason: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>
                  Amount (USD) <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="number"
                  step={0.01}
                  value={generateForm.amount}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, amount: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Generating..." : "Generate Coupon"}
              </Button>
            </form>
          </ComponentCard>

          {/* Success Message with Coupon Code */}
          {generatedCoupon && (
            <ComponentCard title="">
              <div className="p-6 bg-success-50 dark:bg-success-900/20 border-l-4 border-success-500 rounded-lg">
                <h5 className="mb-4 text-lg font-semibold text-success-800 dark:text-success-200">
                  Coupon generated successfully
                </h5>
                <div className="space-y-4">
                  <div>
                    <Label>Coupon Code</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={generatedCoupon.code}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        onClick={() => handleCopyCode(generatedCoupon.code)}
                        startIcon={<CopyIcon className="w-4 h-4" />}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Customer (Optional for sending)</Label>
                    <Input
                      type="text"
                      value={customerInput}
                      onChange={(e) => setCustomerInput(e.target.value)}
                      placeholder="Customer email or ticket ID"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSendCoupon(generatedCoupon.code)}
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Send coupon to customer"}
                    </Button>
                    <Button
                      onClick={() => handleSendCredit(generatedCoupon.code)}
                      disabled={submitting}
                      variant="outline"
                    >
                      {submitting ? "Sending..." : "Auto-send .credit to customer"}
                    </Button>
                  </div>
                </div>
              </div>
            </ComponentCard>
          )}
        </div>
      )}

      {/* Balance Tab */}
      {activeTab === "balance" && (
        <div className="space-y-6">
          <ComponentCard title="Check Coupon Balance">
            <form onSubmit={handleCheckBalance} className="space-y-4">
              <div>
                <Label>Coupon Code</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={balanceCode}
                    onChange={(e) => setBalanceCode(e.target.value)}
                    placeholder="CP-20240115-1234"
                    required
                  />
                  <Button type="submit" disabled={checkingBalance}>
                    {checkingBalance ? "Checking..." : "Check"}
                  </Button>
                </div>
              </div>
            </form>
          </ComponentCard>

          {/* Coupon Balance Display */}
          {couponBalance && (
            <ComponentCard title="Coupon Details">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Remaining Balance</span>
                  <span className="font-bold text-lg">
                    {formatUSD(couponBalance.remainingBalance || couponBalance.balance || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Issue Date/Time</span>
                  <span>
                    {formatDateDisplay(couponBalance.createdAt || couponBalance.issuedAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Issued By</span>
                  <span>
                    {couponBalance.issuedBy?.name || couponBalance.employee?.name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Validity Status</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      couponBalance.status === "ACTIVE" || couponBalance.status === "VALID"
                        ? "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400"
                        : couponBalance.status === "EXPIRED"
                        ? "bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400"
                        : couponBalance.status === "USED"
                        ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        : "bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400"
                    }`}
                  >
                    {couponBalance.status || "UNKNOWN"}
                  </span>
                </div>
                {(couponBalance.remainingBalance || 0) > 0 ||
                (couponBalance.balance || 0) > 0 ? (
                  <Button
                    onClick={() => {
                      setShowClearModal(true);
                      setClearAmount("");
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    Clear Balance
                  </Button>
                ) : null}
              </div>
            </ComponentCard>
          )}

          {/* Honor Coupon */}
          <ComponentCard title="Honor Coupon">
            <form onSubmit={handleHonor} className="space-y-4">
              <div>
                <Label>Coupon Code</Label>
                <Input
                  type="text"
                  value={balanceCode}
                  onChange={(e) => setBalanceCode(e.target.value)}
                  placeholder="CP-20240115-1234"
                  required
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Processing..." : "Honor Coupon"}
              </Button>
            </form>
          </ComponentCard>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Issued Coupons */}
          <ComponentCard title="Issued Coupons">
            {loading ? (
              <div className="text-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mx-auto"></div>
              </div>
            ) : history.issued && history.issued.length > 0 ? (
              <div className="space-y-2">
                {history.issued.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono font-medium text-gray-800 dark:text-white/90">
                          {coupon.code}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {coupon.customerName} - {formatUSD(Number(coupon.amount))}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          coupon.status === "USED"
                            ? "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400"
                            : "bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400"
                        }`}
                      >
                        {coupon.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No coupons issued
              </p>
            )}
          </ComponentCard>

          {/* Honored Coupons */}
          <ComponentCard title="Honored Coupons">
            {loading ? (
              <div className="text-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mx-auto"></div>
              </div>
            ) : history.honored && history.honored.length > 0 ? (
              <div className="space-y-2">
                {history.honored.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono font-medium text-gray-800 dark:text-white/90">
                          {coupon.code}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatUSD(Number(coupon.amount))} -{" "}
                          {formatDateDisplay(coupon.usedAt || "")}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">
                        USED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No coupons honored
              </p>
            )}
          </ComponentCard>
        </div>
      )}

      {/* Clear Balance Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => {
          setShowClearModal(false);
          setClearAmount("");
        }}
        className="max-w-md p-6 lg:p-10"
      >
        <h4 className="font-semibold text-gray-800 mb-4 text-title-sm dark:text-white/90">
          Clear Coupon Balance
        </h4>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Remaining balance:{" "}
          <strong>
            {formatUSD(couponBalance?.remainingBalance || couponBalance?.balance || 0)}
          </strong>
        </p>
        <div className="mb-4">
          <Label>Enter Amount (must equal remaining balance)</Label>
          <Input
            type="number"
            step={0.01}
            value={clearAmount}
            onChange={(e) => setClearAmount(e.target.value)}
            placeholder={String(couponBalance?.remainingBalance || couponBalance?.balance || 0)}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setShowClearModal(false);
              setClearAmount("");
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleClearBalance} disabled={clearing}>
            {clearing ? "Clearing..." : "Clear Balance"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Coupons</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Generate and manage customer coupons
            </p>
          </div>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        </div>
      }
    >
      <CouponsPageContent />
    </Suspense>
  );
}

