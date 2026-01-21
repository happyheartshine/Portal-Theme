"use client";

import { useState, useEffect } from "react";
import { managerApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import { AlertIcon, CheckCircleIcon } from "@/icons";

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Warning {
  id: string;
  message?: string;
  reason?: string;
  employee?: { name: string };
  employeeName?: string;
  sourceTag?: string;
  createdAt: string;
}

export default function ManagerDisciplinePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"recent" | "archive">("recent");
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [warningsLoading, setWarningsLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
    fetchWarnings();
  }, [activeTab]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await managerApi.getEmployeeOptions();
      setEmployees(response.data || []);
    } catch (error: any) {
      console.error("Failed to load employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarnings = async (nextCursor: string | null = null) => {
    try {
      if (!nextCursor) setWarningsLoading(true);
      const params: Record<string, any> = {
        tab: activeTab,
        cursor: nextCursor || undefined,
        limit: 20,
      };
      const response = await managerApi.getWarnings(params);
      const newWarnings = response.data?.items || response.data || [];
      if (nextCursor) {
        setWarnings((prev) => [...prev, ...newWarnings]);
      } else {
        setWarnings(newWarnings);
      }
      setCursor(response.data?.nextCursor || null);
      setHasMore(!!response.data?.nextCursor);
    } catch (error: any) {
      toast.error("Failed to load warnings");
      console.error("Warnings error:", error);
    } finally {
      setWarningsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    if (!message.trim()) {
      toast.error("Please provide a warning message");
      return;
    }

    try {
      setSubmitting(true);
      await managerApi.issueWarning({
        userId: selectedEmployee,
        message: message.trim(),
      });

      toast.success("Warning issued successfully");

      setSelectedEmployee("");
      setMessage("");

      if (activeTab === "recent") {
        fetchWarnings();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to issue warning");
      console.error("Issue warning error:", error);
    } finally {
      setSubmitting(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Discipline</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Issue warnings and view warning history
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("recent")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "recent"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setActiveTab("archive")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "archive"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Archive
        </button>
      </div>

      {/* Issue Warning Form */}
      {activeTab === "recent" && (
        <ComponentCard title="Issue Warning">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>
                Select Employee <span className="text-error-500">*</span>
              </Label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
                disabled={loading || submitting}
                required
              >
                <option value="">-- Select an employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
              {loading && (
                <p className="text-sm text-gray-500 mt-1">Loading employees...</p>
              )}
            </div>

            <div>
              <Label>
                Warning Message <span className="text-error-500">*</span>
              </Label>
              <TextArea
                value={message}
                onChange={(value) => setMessage(value)}
                rows={5}
                placeholder="Provide a detailed warning message..."
                disabled={submitting}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                This message will be visible to the employee on their dashboard.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={submitting}
                startIcon={
                  submitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <AlertIcon className="w-4 h-4" />
                  )
                }
              >
                {submitting ? "Issuing..." : "Issue Warning"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedEmployee("");
                  setMessage("");
                }}
                disabled={submitting}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </ComponentCard>
      )}

      {/* Warnings List */}
      <ComponentCard
        title={activeTab === "recent" ? "Recent Warnings" : "Archived Warnings"}
      >
        {warningsLoading && warnings.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        ) : warnings.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="w-16 h-16 text-success-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No warnings found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warnings.map((warning) => (
              <div
                key={warning.id}
                className={`p-4 rounded border ${
                  activeTab === "recent"
                    ? "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {warning.message || warning.reason}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Employee: <strong>{warning.employee?.name || warning.employeeName || "N/A"}</strong>
                    </p>
                    {warning.sourceTag && (
                      <p className="text-sm text-gray-500 mt-1">{warning.sourceTag}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{formatDate(warning.createdAt)}</p>
              </div>
            ))}
            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => fetchWarnings(cursor)}
                  disabled={warningsLoading}
                >
                  {warningsLoading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}

