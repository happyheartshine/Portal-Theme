"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { employeeApi, managerApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import { formatINR } from "@/utils/currency";
import { useAuth } from "@/contexts/AuthContext";
import { hasRole } from "@/lib/auth";
import DashboardCard from "@/components/common/DashboardCard";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { GridIcon, CalenderIcon, BoxIcon, ShootingStarIcon, FileIcon, AlertIcon, CheckCircleIcon, DollarLineIcon } from "@/icons";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DashboardData {
  salary?: number;
  totalDeductions?: number;
  approvedOrders?: number;
  ongoingRefunds?: number;
  unreadWarnings?: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [dailyOrdersData, setDailyOrdersData] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [monthlyOrdersData, setMonthlyOrdersData] = useState<{ labels: string[]; values: number[] } | null>(null);

  // Check if user can view analytics (MANAGER or ADMIN)
  const canViewAnalytics = user && hasRole(user.role, ["MANAGER", "ADMIN"]);

  useEffect(() => {
    // Don't fetch if auth is still loading or user is not authenticated
    if (authLoading || !user) {
      return;
    }

    fetchDashboard();
    // Only fetch analytics if user has permission
    if (canViewAnalytics) {
      fetchOrderGraphs();
    }
  }, [selectedMonth, canViewAnalytics, authLoading, user]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getDashboard(selectedMonth || undefined);
      setDashboardData(response.data);
    } catch (error: any) {
      // Don't show error toast for 401 - it means user needs to login
      if (error.response?.status === 401) {
        console.error("Unauthorized - user needs to login");
        // The auth interceptor will handle token refresh or redirect
        return;
      }
      toast.error("Failed to load dashboard data");
      console.error("Dashboard error:", error);
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
      }

      // Transform monthly orders data: { data: [{ month, label, count }] } -> { labels, values }
      if (monthlyRes.data?.data) {
        setMonthlyOrdersData({
          labels: monthlyRes.data.data.map((item: any) => (item.label || item.month)),
          values: monthlyRes.data.data.map((item: any) => item.count),
        });
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

  if (!dashboardData) {
    return (
      <ComponentCard title="Dashboard">
        <p className="text-center text-gray-500 dark:text-gray-400">No data available</p>
      </ComponentCard>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Overview of your activity and earnings</p>
        </div>
        <div>
          <input
            type="month"
            className="h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            placeholder="Select month"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Salary Card */}
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <DashboardCard
            title="Salary"
            value={formatINR(dashboardData.salary || 0)}
            subtitle="Monthly Earnings"
            icon={<DollarLineIcon />}
          />
        </div>

        {/* Deductions Card */}
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <DashboardCard
            title="Deductions"
            value={`-${formatINR(dashboardData.totalDeductions || 0)}`}
            subtitle="Total Deducted"
            icon={<DollarLineIcon />}
            valueClassName="text-red-500"
          />
        </div>

        {/* Approved Orders Card */}
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <DashboardCard
            title="Approved Orders"
            value={dashboardData.approvedOrders || 0}
            subtitle="Orders Completed"
            icon={<CheckCircleIcon />}
            valueClassName="text-green-500"
          />
        </div>

        {/* Ongoing Refunds Card */}
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <DashboardCard
            title="Refunds"
            value={dashboardData.ongoingRefunds || 0}
            subtitle="Pending Refunds"
            icon={<FileIcon />}
            valueClassName="text-yellow-500"
          />
        </div>

        {/* Warnings Card */}
        {dashboardData.unreadWarnings && dashboardData.unreadWarnings > 0 && (
          <div className="col-span-12">
            <div className="rounded-2xl border-l-4 border-red-500 border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl text-red-500">
                  <AlertIcon />
                </div>
                <div>
                  <h5 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
                    Unread Warnings
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have <strong>{dashboardData.unreadWarnings}</strong> unread warning(s). Please check your warnings page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="col-span-12">
          <ComponentCard title="Quick Actions">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Link href="/attendance">
                <Button variant="outline" className="w-full" startIcon={<CalenderIcon />}>
                  Mark Attendance
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="outline" className="w-full" startIcon={<BoxIcon />}>
                  Submit Orders
                </Button>
              </Link>
              <Link href="/coupons?tab=generate">
                <Button variant="outline" className="w-full" startIcon={<ShootingStarIcon />}>
                  Generate Coupon
                </Button>
              </Link>
              <Link href="/refunds?tab=new">
                <Button variant="outline" className="w-full" startIcon={<FileIcon />}>
                  New Refund
                </Button>
              </Link>
            </div>
          </ComponentCard>
        </div>

        {/* Order Graphs - Only for MANAGER/ADMIN */}
        {canViewAnalytics && (
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
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
        )}
      </div>
    </>
  );
}
