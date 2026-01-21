"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { employeeApi, managerApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import { nowIST, formatDateInput, formatDateDisplay } from "@/utils/datetime";
import { useAuth } from "@/contexts/AuthContext";
import { hasRole } from "@/lib/auth";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Order {
  id: string;
  dateKey: string;
  submittedCount: number;
  approvedCount?: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface ApprovedOrder {
  id: string;
  dateKey?: string;
  createdAt?: string;
  submittedCount?: number;
  approvedCount?: number;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvedOrders, setApprovedOrders] = useState<ApprovedOrder[]>([]);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [recentOrdersData, setRecentOrdersData] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [hasMoreApproved, setHasMoreApproved] = useState(true);
  const approvedCursorRef = useRef<string | null>(null);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedDate, setSelectedDate] = useState(formatDateInput(nowIST()));
  const [submittedCount, setSubmittedCount] = useState<string>("0");
  const submitAreaRef = useRef<HTMLDivElement>(null);

  // Check if user can view analytics (MANAGER or ADMIN)
  const canViewAnalytics = user && hasRole(user.role, ["MANAGER", "ADMIN"]);

  useEffect(() => {
    fetchOrders();
    fetchApprovedOrders();
    // Only fetch analytics if user has permission
    if (canViewAnalytics) {
      fetchRecentOrdersGraph();
    }
    // Focus submit area if coming from dashboard
    if (typeof window !== "undefined" && window.location.hash === "#submit") {
      setTimeout(() => submitAreaRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [canViewAnalytics]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getOrders(currentMonth);
      setOrders(response.data || []);
    } catch (error: any) {
      toast.error("Failed to load orders");
      console.error("Orders error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedOrders = async (cursor: string | null = null) => {
    try {
      setApprovedLoading(true);
      const response = await employeeApi.getApprovedOrders(cursor || undefined, 10);
      const newOrders = response.data?.items || [];
      setApprovedOrders((prev) => (cursor ? [...prev, ...newOrders] : newOrders));
      approvedCursorRef.current = response.data?.nextCursor || null;
      setHasMoreApproved(!!response.data?.nextCursor);
    } catch (error: any) {
      toast.error("Failed to load approved orders");
      console.error("Approved orders error:", error);
    } finally {
      setApprovedLoading(false);
    }
  };

  const fetchRecentOrdersGraph = async () => {
    try {
      const response = await managerApi.getDailyOrdersRecent(14);
      // Transform API response { data: [{ date, count }] } to chart format
      const chartData = response.data?.data || [];
      setRecentOrdersData({
        labels: chartData.map((item: any) => item.date),
        values: chartData.map((item: any) => item.count),
      });
    } catch (error) {
      console.error("Failed to load recent orders graph:", error);
      // Silently fail - don't show error toast for analytics
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const count = parseInt(submittedCount);
    if (isNaN(count) || count < 0) {
      toast.error("Count must be 0 or greater");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    try {
      setSubmitting(true);
      await employeeApi.createOrder({
        dateKey: selectedDate,
        submittedCount: count,
      });
      toast.success("Order submitted successfully");
      fetchOrders();
      setSubmittedCount("0");
      setSelectedDate(formatDateInput(nowIST()));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to submit order";
      toast.error(errorMessage);
      console.error("Submit order error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOrder = orders.find((o) => o.dateKey === selectedDate);
  const canEdit = !selectedOrder || selectedOrder.status === "PENDING" || selectedOrder.status === "REJECTED";

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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Daily Orders</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Submit and track your daily orders</p>
      </div>

      {/* Submit Order Form */}
      <div ref={submitAreaRef}>
        <ComponentCard title="Submit Order">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>
                Date <span className="text-error-500">*</span>
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={formatDateInput(nowIST())}
                required
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Selected: {formatDateDisplay(selectedDate)}
              </p>
            </div>
            <div>
              <Label>
                Submitted Count <span className="text-error-500">*</span>
              </Label>
              <Input
                type="number"
                value={submittedCount}
                onChange={(e) => setSubmittedCount(e.target.value)}
                disabled={!canEdit}
                min="0"
                required
              />
              {selectedOrder && selectedOrder.status === "APPROVED" && (
                <p className="mt-1 text-sm text-red-500">Cannot modify approved order</p>
              )}
            </div>
            <Button type="submit" disabled={!canEdit || submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Order"}
            </Button>
          </form>
        </ComponentCard>
      </div>

      {/* Order History */}
      <ComponentCard title="Order History">
        <div className="space-y-2">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
              >
                <div>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {formatDateDisplay(order.dateKey)}
                  </span>
                  <span
                    className={`ml-2 rounded px-2 py-1 text-xs ${
                      order.status === "APPROVED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : order.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-800 dark:text-white/90">
                    Submitted: {order.submittedCount}
                  </div>
                  {order.approvedCount !== null && order.approvedCount !== undefined && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Approved: {order.approvedCount}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-gray-500 dark:text-gray-400">
              No orders submitted this month
            </p>
          )}
        </div>
      </ComponentCard>

      {/* Approved Orders List */}
      <ComponentCard title="Previous Approved Orders">
        {approvedLoading && approvedOrders.length === 0 ? (
          <div className="py-4 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        ) : approvedOrders.length > 0 ? (
          <div className="space-y-2">
            {approvedOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
              >
                <div>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {formatDateDisplay(order.dateKey || order.createdAt || "")}
                  </span>
                  <span className="ml-2 rounded bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    APPROVED
                  </span>
                </div>
                <div className="text-right text-sm text-gray-800 dark:text-white/90">
                  Count: {order.submittedCount || order.approvedCount || 0}
                </div>
              </div>
            ))}
            {hasMoreApproved && (
              <Button
                onClick={() => fetchApprovedOrders(approvedCursorRef.current)}
                disabled={approvedLoading}
                variant="outline"
                className="mt-4 w-full"
              >
                {approvedLoading ? "Loading..." : "Load More"}
              </Button>
            )}
          </div>
        ) : (
          <p className="py-4 text-center text-gray-500 dark:text-gray-400">No approved orders found</p>
        )}
      </ComponentCard>

      {/* Recent Days Orders Graph - Only for MANAGER/ADMIN */}
      {canViewAnalytics && recentOrdersData && (
        <ComponentCard title="Recent Days Orders (Last 14 Days)">
          <ReactApexChart
            options={{
              chart: { type: "line", toolbar: { show: false } },
              xaxis: {
                categories: recentOrdersData.labels || [],
                title: { text: "Date" },
              },
              yaxis: { title: { text: "Order Count" } },
              dataLabels: { enabled: false },
              stroke: { curve: "smooth" },
            }}
            series={[{ name: "Orders", data: recentOrdersData.values || [] }]}
            type="line"
            height={250}
          />
        </ComponentCard>
      )}
    </div>
  );
}
