"use client";

import { useState, useEffect } from "react";
import { employeeApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import { formatINR } from "@/utils/currency";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { CheckCircleIcon, AlertIcon } from "@/icons";

interface Warning {
  id: string;
  reason: string;
  sourceTag: string;
  note?: string;
  deductionAmount?: string | number;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export default function WarningsPage() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarnings();
  }, []);

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getWarnings();
      setWarnings(response.data || []);
    } catch (error: any) {
      toast.error("Failed to load warnings");
      console.error("Warnings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await employeeApi.markWarningRead(id);
      toast.success("Warning marked as read");
      fetchWarnings();
    } catch (error: any) {
      toast.error("Failed to mark warning as read");
      console.error("Mark read error:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadWarnings = warnings.filter((w) => !w.isRead);
  const readWarnings = warnings.filter((w) => w.isRead);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Warnings</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">View and manage your warnings</p>
      </div>

      {/* Unread Warnings */}
      {unreadWarnings.length > 0 && (
        <ComponentCard title={
          <div className="flex items-center gap-2">
            <AlertIcon className="w-6 h-6 text-warning-500" />
            <span>Unread Warnings ({unreadWarnings.length})</span>
          </div>
        }>
          <div className="space-y-3">
            {unreadWarnings.map((warning) => (
              <div
                key={warning.id}
                className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{warning.reason}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{warning.sourceTag}</p>
                    {warning.note && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{warning.note}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleMarkRead(warning.id)}
                    startIcon={<CheckCircleIcon className="w-4 h-4" />}
                  >
                    Mark Read
                  </Button>
                </div>
                {warning.deductionAmount && (
                  <p className="text-sm text-error-600 dark:text-error-400 mt-2">
                    Deduction: {formatINR(Number(warning.deductionAmount))}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {formatDate(warning.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </ComponentCard>
      )}

      {/* Read Warnings */}
      {readWarnings.length > 0 && (
        <ComponentCard title="Read Warnings">
          <div className="space-y-3">
            {readWarnings.map((warning) => (
              <div
                key={warning.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">{warning.reason}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{warning.sourceTag}</p>
                  {warning.note && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{warning.note}</p>
                  )}
                </div>
                {warning.deductionAmount && (
                  <p className="text-sm text-error-600 dark:text-error-400 mt-2">
                    Deduction: {formatINR(Number(warning.deductionAmount))}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Read on {formatDate(warning.readAt || warning.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </ComponentCard>
      )}

      {/* No Warnings */}
      {warnings.length === 0 && (
        <ComponentCard>
          <div className="text-center py-8">
            <CheckCircleIcon className="w-16 h-16 text-success-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No warnings found</p>
          </div>
        </ComponentCard>
      )}
    </div>
  );
}

