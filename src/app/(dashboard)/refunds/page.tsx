"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { employeeApi } from "@/lib/apiClient";
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

function RefundsPageContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "new";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    setActiveTab((prevTab) => {
      return tabFromUrl !== prevTab ? tabFromUrl : prevTab;
    });
  }, [tabFromUrl]);

  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(() => tabFromUrl !== "new");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [editingRefund, setEditingRefund] = useState<Refund | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    zelleSenderName: "",
    server: "",
    category: "",
    reason: "",
    amount: "",
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [formTab, setFormTab] = useState<"details" | "payment">("details");

  const fetchRefunds = useCallback(
    async (status: string, nextCursor: string | null = null) => {
      try {
        if (!nextCursor) setLoading(true);
        const response = await employeeApi.getRefunds(status, nextCursor || undefined, 10);
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

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore && cursor) {
          fetchRefunds("ARCHIVED", cursor);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
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
      const response = await employeeApi.searchRefunds(
        searchQuery || undefined,
        searchAmount ? parseFloat(searchAmount) : undefined,
        undefined,
        50
      );
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.customerName ||
      !formData.zelleSenderName ||
      !formData.server ||
      !formData.category ||
      !formData.reason ||
      !formData.amount
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount (0 or greater)");
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append("customerName", formData.customerName.trim());
      data.append("zelleSenderName", formData.zelleSenderName.trim());
      data.append("server", formData.server.trim());
      data.append("category", formData.category.trim());
      data.append("reason", formData.reason.trim());
      data.append("amount", amount.toString());
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
      fetchRefunds("PENDING");
    } catch (error: any) {
      console.error("Create refund error:", error);
      console.error("Error response:", error.response?.data);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message.join(", ")
          : "Failed to create refund request");
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (refund: Refund) => {
    setEditingRefund(refund);
    setFormData({
      customerName: refund.customerName || "",
      zelleSenderName: refund.zelleSenderName || "",
      server: refund.server || "",
      category: refund.category || "",
      reason: refund.reason || "",
      amount: String(refund.amount || ""),
    });
    setScreenshot(null);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRefund) return;

    try {
      setSubmitting(true);
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

      await employeeApi.updateRefund(editingRefund.id, data);
      toast.success("Refund updated successfully");
      setEditingRefund(null);
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
      toast.error(error.response?.data?.message || "Failed to update refund");
      console.error("Update refund error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmInformed = async () => {
    if (!showConfirmModal) return;

    try {
      await employeeApi.confirmRefundInformed(showConfirmModal);
      toast.success("Refund request archived");
      setShowConfirmModal(null);
      if (activeTab === "done") {
        fetchRefunds("DONE");
      }
    } catch (error: any) {
      toast.error("Failed to confirm informed");
      console.error("Confirm informed error:", error);
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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Refund Requests</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Create and track refund requests
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
      <ComponentCard title="">
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
          {/* 2 Tabs in one row */}
          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setFormTab("details")}
              className={`px-4 py-2 font-medium transition-colors ${
                formTab === "details"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setFormTab("payment")}
              className={`px-4 py-2 font-medium transition-colors ${
                formTab === "payment"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Payment
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formTab === "details" && (
              <div className="space-y-4">
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
              </div>
            )}

            {formTab === "payment" && (
              <div className="space-y-4">
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
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Refund Request"}
              </Button>
            </div>
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
            <ComponentCard title="">
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No refund requests found
              </p>
            </ComponentCard>
          ) : (
            refunds.map((refund) => (
              <ComponentCard key={refund.id} title="">
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
                      <p className="text-xs text-warning-700 dark:text-warning-300 mt-1">
                        Remaining:{" "}
                        {formatUSD(Number(refund.amount) - refund.partialRefundedAmountUSD)}
                      </p>
                    </div>
                  )}

                <div className="flex gap-2">
                  {activeTab === "pending" && (
                    <>
                      {isEditable(refund) ? (
                        <Button size="sm" onClick={() => handleEdit(refund)}>
                          Edit
                        </Button>
                      ) : (
                        <Button size="sm" disabled variant="outline">
                          Edit Expired
                        </Button>
                      )}
                    </>
                  )}
                  {activeTab === "done" && (
                    <Button
                      size="sm"
                      onClick={() => setShowConfirmModal(refund.id)}
                      disabled={
                        !!(
                          refund.partialRefundedAmountUSD &&
                          refund.partialRefundedAmountUSD < Number(refund.amount)
                        )
                      }
                      variant="outline"
                    >
                      {refund.partialRefundedAmountUSD &&
                      refund.partialRefundedAmountUSD < Number(refund.amount)
                        ? "Waiting for Full Refund"
                        : "Confirm"}
                    </Button>
                  )}
                </div>
              </ComponentCard>
            ))
          )}
          {activeTab === "archived" && hasMore && (
            <div
              ref={observerTarget}
              className="h-10 flex items-center justify-center"
            >
              {loading && (
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingRefund}
        onClose={() => {
          setEditingRefund(null);
          setFormData({
            customerName: "",
            zelleSenderName: "",
            server: "",
            category: "",
            reason: "",
            amount: "",
          });
          setScreenshot(null);
        }}
        className="max-w-2xl p-6 lg:p-10"
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
            Edit Refund Request
          </h4>
          <button
            onClick={() => {
              setEditingRefund(null);
              setFormData({
                customerName: "",
                zelleSenderName: "",
                server: "",
                category: "",
                reason: "",
                amount: "",
              });
              setScreenshot(null);
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <CloseLineIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleUpdate} className="space-y-4">
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
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setEditingRefund(null);
                setFormData({
                  customerName: "",
                  zelleSenderName: "",
                  server: "",
                  category: "",
                  reason: "",
                  amount: "",
                });
                setScreenshot(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Refund"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={!!showConfirmModal}
        onClose={() => {
          toast.info("Please inform the customer before archiving.");
          setShowConfirmModal(null);
        }}
        className="max-w-md p-6 lg:p-10"
      >
        <h4 className="font-semibold text-gray-800 mb-4 text-title-sm dark:text-white/90">
          Confirm Customer Notification
        </h4>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Customer has been notified in the ticket?
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              toast.info("Please inform the customer before archiving.");
              setShowConfirmModal(null);
            }}
          >
            No
          </Button>
          <Button onClick={handleConfirmInformed}>Yes</Button>
        </div>
      </Modal>
    </div>
  );
}

export default function RefundsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      }
    >
      <RefundsPageContent />
    </Suspense>
  );
}

