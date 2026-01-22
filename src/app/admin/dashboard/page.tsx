"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { formatINR, formatUSD } from "@/utils/currency";
import { BoxCubeIcon, FileIcon, DollarLineIcon, FolderIcon, GroupIcon, TrashBinIcon, ArrowRightIcon } from "@/icons";
import SkeletonLoader from "@/components/common/SkeletonLoader";

interface OrderAnalytics {
  totalOrders?: number;
  approvedOrders?: number;
  pendingOrders?: number;
  rejectedOrders?: number;
}

interface RefundAnalytics {
  totalRefunds?: number;
  totalAmount?: number;
  averageAmount?: number;
  byStatus?: Record<string, number>;
}

interface CreditAnalytics {
  totalCredits?: number;
  totalAmount?: number;
}

interface PendingSalary {
  totalPending?: number;
  employeeCount?: number;
}

export default function AdminDashboardPage() {
  const [orderAnalytics, setOrderAnalytics] = useState<OrderAnalytics | null>(null);
  const [refundAnalytics, setRefundAnalytics] = useState<RefundAnalytics | null>(null);
  const [creditAnalytics, setCreditAnalytics] = useState<CreditAnalytics | null>(null);
  const [pendingSalary, setPendingSalary] = useState<PendingSalary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<string>('week');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchAllAnalytics();
  }, [selectedRange, selectedMonth]);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      
      // Map string range values to numeric values expected by backend
      const rangeMap: Record<string, number> = {
        'week': 7,
        'month': 30,
        'year': 30  // Backend only supports 7, 15, 30, so use 30 for year
      };
      const numericRange = rangeMap[selectedRange] || 7;
      
      // Load data in parallel but don't block page render
      const [orders, refunds, credits, salary] = await Promise.all([
        adminApi.getOrderAnalytics(numericRange.toString()).catch(err => {
          console.error('Order analytics error:', err);
          return { data: null };
        }),
        adminApi.getRefundAnalytics(selectedMonth, false).catch(err => {
          console.error('Refund analytics error:', err);
          return { data: null };
        }),
        adminApi.getCreditAnalytics(selectedMonth).catch(err => {
          console.error('Credit analytics error:', err);
          return { data: null };
        }),
        adminApi.getPendingSalary(selectedMonth).catch(err => {
          console.error('Pending salary error:', err);
          return { data: null };
        })
      ]);
      
      // Update state as data arrives
      setOrderAnalytics(orders.data);
      setRefundAnalytics(refunds.data);
      setCreditAnalytics(credits.data);
      setPendingSalary(salary.data);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">System overview and analytics</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Orders */}
        <ComponentCard title="Total Orders" className="p-6">
          {loading && !orderAnalytics ? (
            <div className="space-y-3">
              <SkeletonLoader variant="rectangular" height={32} />
              <SkeletonLoader variant="rectangular" height={24} width="60%" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</h5>
                <BoxCubeIcon className="w-8 h-8 text-primary-500 dark:text-primary-400" />
              </div>
              <h2 className="text-3xl font-bold mb-1 text-gray-800 dark:text-white/90">{orderAnalytics?.totalOrders || 0}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {orderAnalytics?.approvedOrders || 0} approved
              </p>
            </>
          )}
        </ComponentCard>

        {/* Total Refunds */}
        <ComponentCard title="Total Refunds" className="p-6">
          {loading && !refundAnalytics ? (
            <div className="space-y-3">
              <SkeletonLoader variant="rectangular" height={32} />
              <SkeletonLoader variant="rectangular" height={24} width="60%" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Refunds</h5>
                <FileIcon className="w-8 h-8 text-warning-500 dark:text-warning-400" />
              </div>
              <h2 className="text-3xl font-bold mb-1 text-gray-800 dark:text-white/90">{refundAnalytics?.totalRefunds || 0}</h2>
              <p className="text-sm text-red-600 dark:text-red-400">
                {refundAnalytics?.totalAmount != null
                  ? formatUSD(refundAnalytics.totalAmount)
                  : formatUSD(0)}
              </p>
            </>
          )}
        </ComponentCard>

        {/* Credits Generated */}
        <ComponentCard title="Credits" className="p-6">
          {loading && !creditAnalytics ? (
            <div className="space-y-3">
              <SkeletonLoader variant="rectangular" height={32} />
              <SkeletonLoader variant="rectangular" height={24} width="60%" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Credits</h5>
                <DollarLineIcon className="w-8 h-8 text-success-500 dark:text-success-400" />
              </div>
              <h2 className="text-3xl font-bold mb-1 text-gray-800 dark:text-white/90">{creditAnalytics?.totalCredits || 0}</h2>
              <p className="text-sm text-success-600 dark:text-success-400">
                ${creditAnalytics?.totalAmount?.toFixed(2) || '0.00'}
              </p>
            </>
          )}
        </ComponentCard>

        {/* Pending Salary */}
        <div className="rounded-2xl border-2 border-purple-400 dark:border-purple-500 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-6 text-white shadow-lg">
          {loading && !pendingSalary ? (
            <div className="space-y-3">
              <SkeletonLoader variant="rectangular" height={32} className="bg-purple-400/50" />
              <SkeletonLoader variant="rectangular" height={24} width="60%" className="bg-purple-400/50" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-purple-50 uppercase tracking-wide">Pending Salary</h5>
                <FolderIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-white">
                {pendingSalary?.totalPending != null
                  ? formatINR(pendingSalary.totalPending)
                  : formatINR(0)}
              </h2>
              <div className="mt-3 pt-3 border-t border-purple-400 dark:border-purple-500">
                <p className="text-sm font-medium text-purple-50">
                  <span className="text-lg font-bold">{pendingSalary?.employeeCount || 0}</span> employees
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Order Analytics */}
        <ComponentCard title="Order Analytics">
          {orderAnalytics ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-300">Total Orders</span>
                <span className="font-bold text-lg text-gray-800 dark:text-white/90">{orderAnalytics.totalOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <span className="text-gray-600 dark:text-gray-300">Approved</span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">{orderAnalytics.approvedOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <span className="text-gray-600 dark:text-gray-300">Pending</span>
                <span className="font-bold text-lg text-yellow-600 dark:text-yellow-400">{orderAnalytics.pendingOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                <span className="text-gray-600 dark:text-gray-300">Rejected</span>
                <span className="font-bold text-lg text-red-600 dark:text-red-400">{orderAnalytics.rejectedOrders || 0}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No order data available</p>
          )}
        </ComponentCard>

        {/* Refund Analytics */}
        <ComponentCard title="Refund Analytics">
          {refundAnalytics ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-300">Total Refunds</span>
                <span className="font-bold text-lg text-gray-800 dark:text-white/90">{refundAnalytics.totalRefunds || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span className="text-gray-600 dark:text-gray-300">Total Amount</span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {refundAnalytics.totalAmount != null
                    ? formatUSD(refundAnalytics.totalAmount)
                    : formatUSD(0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                <span className="text-gray-600 dark:text-gray-300">Average Refund</span>
                <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                  {refundAnalytics.averageAmount != null
                    ? formatUSD(refundAnalytics.averageAmount)
                    : formatUSD(0)}
                </span>
              </div>
              {refundAnalytics.byStatus && (
                <div className="pt-2 space-y-2">
                  {Object.entries(refundAnalytics.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">{status}</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No refund data available</p>
          )}
        </ComponentCard>
      </div>

      {/* Quick Actions */}
      <ComponentCard title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <GroupIcon className="w-6 h-6 text-primary-500 dark:text-primary-400" />
            <div>
              <div className="font-medium text-gray-800 dark:text-white/90">Manage Users</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Create and manage accounts</div>
            </div>
          </Link>
          
          <Link
            href="/admin/purge"
            className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <TrashBinIcon className="w-6 h-6 text-red-500 dark:text-red-400" />
            <div>
              <div className="font-medium text-gray-800 dark:text-white/90">Data Purge</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Clean up old records</div>
            </div>
          </Link>
          
          <button
            onClick={fetchAllAnalytics}
            className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <ArrowRightIcon className="w-6 h-6 text-success-500 dark:text-success-400 group-hover:rotate-90 transition-transform" />
            <div>
              <div className="font-medium text-gray-800 dark:text-white/90">Refresh Data</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Update analytics</div>
            </div>
          </button>
        </div>
      </ComponentCard>
    </div>
  );
}
