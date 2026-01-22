"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { managerApi, employeeApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import { formatUSD } from "@/utils/currency";
import { formatDateDisplay, nowIST } from "@/utils/datetime";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { CloseLineIcon } from "@/icons";

interface Refund {
  id: string;
  customerName: string;
  zelleSenderName: string;
  server: string;
  category: string;
  reason: string;
  amount: number | string;
  status: "PENDING" | "DONE" | "ARCHIVED";
  createdAt: string;
  editable?: boolean;
  editableUntil?: string;
  partialRefundedAmountUSD?: number;
}

function ManagerRefundsPageContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "pending";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(initialTab !== "new");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const [editingRefund, setEditingRefund] = useState<Refund | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);
  const [processingRefund, setProcessingRefund] = useState<Refund | null>(null);
  const [refundedAmount, setRefundedAmount] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    zelleSenderName: "",
    server: "",
    category: "",
    reason: "",
    amount: "",
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const fetchRefunds = useCallback(
    async (status: string, nextCursor: string | null = null) => {
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        if (!nextCursor) setLoading(true);
        const params: Record<string, any> = {
          status,
          cursor: nextCursor || undefined,
          limit: 10,
        };
        const response = await managerApi.getManagementRefunds(params);
        const newRefunds = response.data?.items || response.data || [];
        if (nextCursor) {
          setRefunds((prev) => [...prev, ...newRefunds]);
        } else {
          setRefunds(newRefunds);
        }
        setCursor(response.data?.nextCursor || null);
        setHasMore(!!response.data?.nextCursor);
      } catch (error: any) {
        toast.error("Failed to load refunds");
        console.error("Refunds error:", error);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    if (activeTab === "archived") {
      fetchRefunds("ARCHIVED");
    } else if (activeTab === "pending") {
      fetchRefunds("PENDING");
    } else if (activeTab === "done") {
      fetchRefunds("DONE");
    } else if (activeTab === "new") {
      setLoading(false);
    }
  }, [activeTab, fetchRefunds]);

  useEffect(() => {
    if (activeTab !== "archived" || !hasMore || loading) {
      return;
    }

    const currentTarget = observerTarget.current;
    if (!currentTarget) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !isFetchingRef.current) {
          fetchRefunds("ARCHIVED", cursor);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentTarget);

    return () => {
      observer.unobserve(currentTarget);
      observer.disconnect();
    };
  }, [activeTab, cursor, hasMore, loading, fetchRefunds]);

  const handleSearch = async () => {
    if (!searchQuery && !searchAmount) {
      toast.error("Please enter search query or amount");
      return;
    }
    try {
      setIsSearching(true);
      const params: Record<string, any> = {
        q: searchQuery || undefined,
        amount: searchAmount ? parseFloat(searchAmount) : undefined,
        cursor: null,
        limit: 50,
      };
      const response = await managerApi.getManagementRefunds(params);
      setRefunds(response.data?.items || response.data || []);
      setCursor(null);
      setHasMore(false);
    } catch (error: any) {
      toast.error("Failed to search refunds");
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchAmount("");
    setIsSearching(false);
    if (activeTab === "archived") {
      fetchRefunds("ARCHIVED");
    } else if (activeTab === "pending") {
      fetchRefunds("PENDING");
    } else if (activeTab === "done") {
      fetchRefunds("DONE");
    }
  };

  const handleProcess = (refund: Refund) => {
    setProcessingRefund(refund);
    setRefundedAmount(String(refund.amount || ""));
  };

  const confirmProcess = async () => {
    if (!processingRefund) return;

    const amount = parseFloat(refundedAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid refunded amount");
      return;
    }

    if (amount > parseFloat(String(processingRefund.amount))) {
      toast.error("Refunded amount cannot exceed requested amount");
      return;
    }

    try {
      setProcessingId(processingRefund.id);
      await managerApi.processManagementRefund(processingRefund.id, {
        refundedAmountUSD: amount,
      } as { refundedAmountUSD: number });
      toast.success("Refund processed successfully");
      setProcessingRefund(null);
      setRefundedAmount("");
      if (activeTab === "pending") {
        fetchRefunds("PENDING");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process refund");
      console.error("Process refund error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setProcessingId("new");
      const data = new FormData();
      data.append("customerName", formData.customerName);
      data.append("zelleSenderName", formData.zelleSenderName);
      data.append("server", formData.server);
      data.append("category", formData.category);
      data.append("reason", formData.reason);
      data.append("amount", formData.amount);
      if (screenshot) {
        data.append("screenshot", screenshot);
      }

      await employeeApi.createRefund(data);
      toast.success("Refund request created successfully");
      setFormData({
        customerName: "",
        zelleSenderName: "",
        server: "",
        category: "",
        reason: "",
        amount: "",
      });
      setScreenshot(null);
      if (activeTab === "pending") {
        fetchRefunds("PENDING");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create refund");
      console.error("Create refund error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmNotified = async (refundId: string) => {
    try {
      await managerApi.archiveManagementRefund(refundId);
      toast.success("Refund archived successfully");
      setShowConfirmModal(null);
      if (activeTab === "done") {
        fetchRefunds("DONE");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to archive refund");
      console.error("Archive error:", error);
    }
  };

  const isEditable = (refund: Refund) => {
    if (refund.editable === false) return false;
    if (refund.editableUntil) {
      return new Date(refund.editableUntil) > nowIST();
    }
    const createdAt = new Date(refund.createdAt);
    const hoursDiff = (nowIST().getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 12;
  };

  if (loading && refunds.length === 0 && !isSearching) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Refund Processing
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Process and approve refund requests
          </p>
        </div>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Refund Processing</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Process and approve refund requests
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("new")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "new"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          New Request
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "pending"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab("done")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "done"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Done
        </button>
        <button
          onClick={() => setActiveTab("archived")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "archived"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Archived
        </button>
      </div>

      {/* Search Bar */}
      <ComponentCard title="Search Refunds">
        <div className="flex gap-2 flex-wrap">
          <Input
            type="text"
            placeholder="Search by customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Input
            type="number"
            step={0.01}
            placeholder="Amount (exact match)"
            value={searchAmount}
            onChange={(e) => setSearchAmount(e.target.value)}
            className="w-32"
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
          {(searchQuery || searchAmount) && (
            <Button variant="outline" onClick={handleClearSearch}>
              Clear
            </Button>
          )}
        </div>
      </ComponentCard>

      {/* New Request Tab */}
      {activeTab === "new" && (
        <ComponentCard title="Create Refund Request">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>
                  Customer Name <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>
                  Zelle Sender Name <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={formData.zelleSenderName}
                  onChange={(e) =>
                    setFormData({ ...formData, zelleSenderName: e.target.value })
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
                  value={formData.server}
                  onChange={(e) =>
                    setFormData({ ...formData, server: e.target.value })
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
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
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
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
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
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Payment Screenshot (Optional)</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    className="focus:border-ring-brand-300 h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs transition-colors file:mr-5 file:border-collapse file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-solid file:border-gray-200 file:bg-gray-50 file:py-3 file:pl-3.5 file:pr-3 file:text-sm file:text-gray-700 placeholder:text-gray-400 hover:file:bg-gray-100 focus:outline-hidden focus:file:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:text-white/90 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400 dark:placeholder:text-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={processingId === "new"}
                  className="px-5 py-3.5 text-sm font-medium inline-flex items-center justify-center gap-2 rounded-lg transition bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed"
                >
                  {processingId === "new" ? "Submitting..." : "Submit Refund Request"}
                </button>
          </form>
        </ComponentCard>
      )}

      {/* Refunds List */}
      {(activeTab === "pending" ||
        activeTab === "done" ||
        activeTab === "archived" ||
        isSearching) && (
        <div className="space-y-4">
          {refunds.length === 0 ? (
            <ComponentCard title="No Results">
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No refund requests found
              </p>
            </ComponentCard>
          ) : (
            refunds.map((refund) => (
              <ComponentCard key={refund.id} title={refund.customerName}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {refund.customerName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatUSD(Number(refund.amount))}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {formatDateDisplay(refund.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      refund.status === "DONE"
                        ? "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400"
                        : refund.status === "PENDING"
                        ? "bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {refund.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{refund.reason}</p>

                {/* Partial Refund Message */}
                {refund.partialRefundedAmountUSD &&
                  refund.partialRefundedAmountUSD < Number(refund.amount) && (
                    <div className="mb-2 p-2 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded">
                      <p className="text-sm text-warning-800 dark:text-warning-200">
                        <strong>Partial amount refunded:</strong>{" "}
                        {formatUSD(refund.partialRefundedAmountUSD)} out of{" "}
                        {formatUSD(Number(refund.amount))}
                      </p>
                    </div>
                  )}

                <div className="flex gap-2">
                  {activeTab === "pending" && (
                    <>
                      {isEditable(refund) && (
                        <Button size="sm" variant="outline" onClick={() => handleProcess(refund)}>
                          Process
                        </Button>
                      )}
                    </>
                  )}
                  {activeTab === "done" && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirmNotified(refund.id)}
                      disabled={
                        !!(
                          refund.partialRefundedAmountUSD &&
                          refund.partialRefundedAmountUSD < Number(refund.amount)
                        )
                      }
                      variant="outline"
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </ComponentCard>
            ))
          )}
          {activeTab === "archived" && hasMore && (
            <div ref={observerTarget} className="h-10 flex items-center justify-center">
              {loading && (
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Process Refund Modal */}
      <Modal
        isOpen={!!processingRefund}
        onClose={() => {
          setProcessingRefund(null);
          setRefundedAmount("");
        }}
        className="max-w-md p-6 lg:p-10"
      >
        <h4 className="font-semibold text-gray-800 mb-4 text-title-sm dark:text-white/90">
          Process Refund
        </h4>
        <div className="space-y-4">
          <div>
            <Label>Requested Amount</Label>
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {formatUSD(Number(processingRefund?.amount || 0))}
            </p>
          </div>
          <div>
            <Label>
              Refunded Amount (USD) <span className="text-error-500">*</span>
            </Label>
            <Input
              type="number"
              step={0.01}
              value={refundedAmount}
              onChange={(e) => setRefundedAmount(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setProcessingRefund(null);
                setRefundedAmount("");
              }}
            >
              Cancel
            </Button>
            <button
              onClick={confirmProcess}
              disabled={processingId === processingRefund?.id}
              className="px-5 py-3.5 text-sm font-medium inline-flex items-center justify-center gap-2 rounded-lg transition bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed"
            >
              {processingId === processingRefund?.id ? "Processing..." : "Process Refund"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ManagerRefundsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      }
    >
      <ManagerRefundsPageContent />
    </Suspense>
  );
}

