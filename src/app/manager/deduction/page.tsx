"use client";

import { useState, useEffect } from "react";
import { managerApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import { formatINR } from "@/utils/currency";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { InfoIcon } from "@/icons";

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface DeductionReason {
  key: string;
  label?: string;
  name?: string;
}

export default function ManagerDeductionPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reasons, setReasons] = useState<DeductionReason[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDeductionReasons();
  }, []);

  const fetchEmployees = async () => {
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

  const fetchDeductionReasons = async () => {
    try {
      const response = await managerApi.getDeductionReasons();
      setReasons(response.data || []);
    } catch (error: any) {
      console.error("Failed to load deduction reasons:", error);
      setReasons([
        { key: "LATE_ARRIVAL", label: "Late Arrival" },
        { key: "ABSENCE", label: "Absence" },
        { key: "PERFORMANCE", label: "Performance Issue" },
        { key: "OTHER", label: "Other" },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    if (!selectedReason) {
      toast.error("Please select a deduction reason");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid deduction amount");
      return;
    }

    try {
      setSubmitting(true);
      await managerApi.createDeduction({
        userId: selectedEmployee,
        amount: amountNum,
        reason: selectedReason,
      });

      toast.success("Deduction issued successfully");

      setSelectedEmployee("");
      setSelectedReason("");
      setAmount("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to issue deduction");
      console.error("Create deduction error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Deduction</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Issue salary deductions to employees
        </p>
      </div>

      <ComponentCard title="Issue Deduction">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>
              Employee <span className="text-error-500">*</span>
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
            {loading && <p className="text-sm text-gray-500 mt-1">Loading employees...</p>}
          </div>

          <div>
            <Label>
              Deduction Reason <span className="text-error-500">*</span>
            </Label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
              disabled={submitting}
              required
            >
              <option value="">-- Select a reason --</option>
              {reasons.map((reason) => (
                <option key={reason.key} value={reason.key}>
                  {reason.label || reason.name || reason.key}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>
              Deduction Amount (INR ₹) <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <Input
                type="number"
                step={0.01}
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={submitting}
                required
                className="pl-8"
              />
            </div>
            {amount && !isNaN(parseFloat(amount)) && (
              <p className="text-sm text-gray-500 mt-1">
                Amount: <strong>{formatINR(parseFloat(amount))}</strong>
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Issuing..." : "Issue Deduction"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedEmployee("");
                setSelectedReason("");
                setAmount("");
              }}
              disabled={submitting}
            >
              Clear Form
            </Button>
          </div>
        </form>
      </ComponentCard>

      {/* Info Notice */}
      <ComponentCard>
        <div className="p-4 bg-brand-50 dark:bg-brand-900/20 border-l-4 border-brand-500 rounded-lg">
          <div className="flex items-start gap-3">
            <InfoIcon className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Note:</strong> Deductions are issued in INR (₹) and will be reflected in the
              employee's salary calculation. The deducted amount will be subtracted from their
              monthly salary.
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
}

