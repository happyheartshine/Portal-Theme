"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { managerApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import { formatUSD } from "@/utils/currency";
import ComponentCard from "@/components/common/ComponentCard";
import { BellIcon } from "@/icons";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DashboardSummary {
  pendingRefunds?: {
    count: number;
    totalAmountUSD: number;
  };
  refundAnalytics?: {
    count: number;
    totalAmountUSD: number;
  };
  creditAnalytics?: {
    count: number;
    totalAmountUSD: number;
  };
}

interface ChartData {
  labels: string[];
  values: number[];
}

export default function ManagerDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyOrdersData, setDailyOrdersData] = useState<ChartData | null>(null);
  const [monthlyOrdersData, setMonthlyOrdersData] = useState<ChartData | null>(null);

  useEffect(() => {
    fetchDashboardSummary();
    fetchOrderGraphs();
  }, []);

  const fetchDashboardSummary = async () => {
    try {
      setLoading(true);
      const response = await managerApi.getDashboardSummary();
      setSummary(response.data);
    } catch {
      // Fallback to old endpoint if new one doesn't exist
      try {
        const fallbackResponse = await managerApi.getDashboardStats();
        setSummary({
          pendingRefunds: {
            count: fallbackResponse.data?.pendingRefunds || 0,
            totalAmountUSD: 0,
          },
          refundAnalytics: {
            count: 0,
            totalAmountUSD: 0,
          },
          creditAnalytics: {
            count: 0,
            totalAmountUSD: 0,
          },
        });
      } catch (fallbackError: any) {
        toast.error("Failed to load dashboard summary");
        console.error("Dashboard error:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderGraphs = async () => {
    try {
      const [dailyRes, monthlyRes] = await Promise.all([
        managerApi.getDailyOrdersThisMonth().catch(() => ({ data: null })),
        managerApi.getMonthlyOrdersLast3().catch(() => ({ data: null })),
      ]);

      // Transform daily orders data: { data: [{ date, count }] } -> { labels, values }
      if (dailyRes.data?.data) {
        setDailyOrdersData({
          labels: dailyRes.data.data.map((item: any) => item.date),
          values: dailyRes.data.data.map((item: any) => item.count),
        });
      } else {
        setDailyOrdersData(null);
      }

      // Transform monthly orders data: { data: [{ month, label, count }] } -> { labels, values }
      if (monthlyRes.data?.data) {
        setMonthlyOrdersData({
          labels: monthlyRes.data.data.map((item: any) => item.label || item.month),
          values: monthlyRes.data.data.map((item: any) => item.count),
        });
      } else {
        setMonthlyOrdersData(null);
      }
    } catch (error) {
      console.error("Failed to load order graphs:", error);
      // Silently fail - don't show error toast for analytics
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Management Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Overview of refunds, credits, and pending approvals
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Total Pending Refunds */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Pending Refunds
            </h5>
          </div>
          <h2 className="text-3xl font-bold text-warning-500 dark:text-warning-400 mb-1">
            {summary?.pendingRefunds?.count || 0}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Total Amount: <strong className="text-warning-500">{formatUSD(summary?.pendingRefunds?.totalAmountUSD || 0)}</strong>
          </p>
          <Link
            href="/manager/refunds"
            className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Process Refunds →
          </Link>
        </div>

        {/* Refund Analytics */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Refund Analytics
            </h5>
          </div>
          <h2 className="text-3xl font-bold text-brand-500 dark:text-brand-400 mb-1">
            {summary?.refundAnalytics?.count || 0}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Amount: <strong className="text-brand-500">{formatUSD(summary?.refundAnalytics?.totalAmountUSD || 0)}</strong>
          </p>
        </div>

        {/* Total Credit Analytics */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Credit Analytics
            </h5>
          </div>
          <h2 className="text-3xl font-bold text-success-500 dark:text-success-400 mb-1">
            {summary?.creditAnalytics?.count || 0}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Amount: <strong className="text-success-500">{formatUSD(summary?.creditAnalytics?.totalAmountUSD || 0)}</strong>
          </p>
        </div>
      </div>

      {/* Order Graphs */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Ongoing Month Orders Graph */}
        {dailyOrdersData && (
          <ComponentCard title="Ongoing Month Orders">
            <ReactApexChart
              options={{
                chart: { type: "line", toolbar: { show: false } },
                xaxis: {
                  categories: dailyOrdersData.labels || [],
                  title: { text: "Day" },
                },
                yaxis: { title: { text: "Order Count" } },
                title: { text: "Daily Orders This Month", align: "left" },
                dataLabels: { enabled: false },
                stroke: { curve: "smooth" },
              }}
              series={[{ name: "Orders", data: dailyOrdersData.values || [] }]}
              type="line"
              height={300}
            />
          </ComponentCard>
        )}

        {/* Monthly Orders Graph */}
        {monthlyOrdersData && (
          <ComponentCard title="Monthly Orders (Last 3 Months)">
            <ReactApexChart
              options={{
                chart: { type: "bar", toolbar: { show: false } },
                xaxis: {
                  categories: monthlyOrdersData.labels || [],
                  title: { text: "Month" },
                },
                yaxis: { title: { text: "Order Count" } },
                title: { text: "Monthly Orders", align: "left" },
                dataLabels: { enabled: true },
              }}
              series={[{ name: "Orders", data: monthlyOrdersData.values || [] }]}
              type="bar"
              height={300}
            />
          </ComponentCard>
        )}
      </div>

      {/* Recent Activity / Alerts */}
      {summary?.pendingRefunds && summary.pendingRefunds.count > 0 && (
        <ComponentCard>
          <div className="p-6 bg-warning-50 dark:bg-warning-900/20 border-l-4 border-warning-500 rounded-lg">
            <div className="flex items-start gap-3">
              <BellIcon className="w-6 h-6 text-warning-500 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="mb-1 font-semibold text-gray-800 dark:text-white/90">
                  Action Required
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You have {summary.pendingRefunds.count} pending refund(s) to process
                </p>
              </div>
            </div>
          </div>
        </ComponentCard>
      )}
    </div>
  );
}
