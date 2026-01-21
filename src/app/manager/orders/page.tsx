"use client";

import { useState, useEffect } from "react";
import { managerApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import { formatDateDisplay } from "@/utils/datetime";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { CheckCircleIcon, UserIcon, CalenderIcon } from "@/icons";

interface Employee {
  id: string;
  name: string;
}

interface Order {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  employee?: { name: string };
  employeeName?: string;
  createdAt?: string;
  date?: string;
  description?: string;
  count?: number;
}

interface Filters {
  status: string;
  employeeId: string;
  from: string;
  to: string;
}

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<Filters>({
    status: "pending",
    employeeId: "",
    from: "",
    to: "",
  });
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchEmployees();
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      const response = await managerApi.getEmployeeOptions();
      setEmployees(response.data || []);
    } catch (error: any) {
      console.error("Failed to load employees:", error);
    }
  };

  const fetchOrders = async (nextCursor: string | null = null) => {
    try {
      if (!nextCursor) setLoading(true);
      const params: Record<string, any> = {
        cursor: nextCursor || undefined,
        limit: 20,
        status: filters.status || undefined,
        employeeId: filters.employeeId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      };
      const response = await managerApi.getManagementOrders(params);
      const newOrders = response.data?.items || response.data || [];
      if (nextCursor) {
        setOrders((prev) => [...prev, ...newOrders]);
      } else {
        setOrders(newOrders);
      }
      setCursor(response.data?.nextCursor || null);
      setHasMore(!!response.data?.nextCursor);
    } catch (error: any) {
      toast.error("Failed to load orders");
      console.error("Orders error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId: string) => {
    if (!confirm("Are you sure you want to approve this order?")) return;

    try {
      setProcessingId(orderId);
      await managerApi.approveManagementOrder(orderId);
      toast.success("Order approved successfully");
      fetchOrders(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve order");
      console.error("Approve error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Order Approvals</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Review and approve pending orders
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Verify Orders</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          View and approve orders from all employees
        </p>
      </div>

      {/* Filters */}
      <ComponentCard title="Filters">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label>Status</Label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <div>
            <Label>Employee</Label>
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>From Date</Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </div>
          <div>
            <Label>To Date</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
        </div>
      </ComponentCard>

      {orders.length === 0 ? (
        <ComponentCard>
          <div className="text-center py-8">
            <CheckCircleIcon className="w-16 h-16 text-success-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white/90">
              All Caught Up!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No pending orders to review at the moment.
            </p>
          </div>
        </ComponentCard>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <ComponentCard
              key={order.id}
              className={`border-l-4 ${
                order.status === "APPROVED"
                  ? "border-success-500"
                  : "border-warning-500"
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      Order #{order.id}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        order.status === "APPROVED"
                          ? "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400"
                          : "bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400"
                      }`}
                    >
                      {order.status === "APPROVED" ? "Approved" : "Pending"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Employee:{" "}
                        <strong>{order.employee?.name || order.employeeName || "N/A"}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalenderIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Date: {formatDateDisplay(order.createdAt || order.date)}
                      </span>
                    </div>
                    {order.description && (
                      <div className="flex items-start gap-2 mt-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          <strong>Details:</strong> {order.description}
                        </span>
                      </div>
                    )}
                    {order.count !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          Count: <strong>{order.count}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {order.status !== "APPROVED" && (
                  <div className="flex md:flex-col gap-2">
                    <Button
                      onClick={() => handleApprove(order.id)}
                      disabled={processingId === order.id}
                      startIcon={
                        processingId === order.id ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        ) : (
                          <CheckCircleIcon className="w-4 h-4" />
                        )
                      }
                    >
                      {processingId === order.id ? "Processing..." : "Approve"}
                    </Button>
                  </div>
                )}
              </div>
            </ComponentCard>
          ))}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => fetchOrders(cursor)}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

