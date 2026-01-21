"use client";

import { useState, useEffect } from "react";
import { managerApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { CheckCircleIcon, UserIcon, CalenderIcon } from "@/icons";

interface AttendanceMember {
  id: string;
  name: string;
  email: string;
  role?: string;
  hasMarkedAttendance: boolean;
  markedAt?: string;
}

export default function ManagerAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMode, setViewMode] = useState<"today" | "custom">("today");

  useEffect(() => {
    if (viewMode === "today") {
      fetchTodayAttendance();
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === "custom" && selectedDate) {
      fetchAttendanceByDate();
    }
  }, [selectedDate, viewMode]);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const response = await managerApi.getTeamAttendanceToday();
      setAttendanceData(response.data || []);
    } catch (error: any) {
      toast.error("Failed to load team attendance");
      console.error("Attendance error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceByDate = async () => {
    try {
      setLoading(true);
      const response = await managerApi.getTeamAttendance(selectedDate);
      setAttendanceData(response.data || []);
    } catch (error: any) {
      toast.error("Failed to load attendance for selected date");
      console.error("Attendance error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewModeChange = (mode: "today" | "custom") => {
    setViewMode(mode);
    if (mode === "today") {
      setSelectedDate("");
    }
  };

  const getAttendanceStats = () => {
    const total = attendanceData.length;
    const present = attendanceData.filter((emp) => emp.hasMarkedAttendance).length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, percentage };
  };

  const stats = getAttendanceStats();

  if (loading && attendanceData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Team Attendance</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Monitor team attendance and work hours
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Team Attendance</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Monitor team attendance and work hours
        </p>
      </div>

      {/* View Mode Selector */}
      <ComponentCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => handleViewModeChange("today")}
              variant={viewMode === "today" ? "primary" : "outline"}
            >
              Today
            </Button>
            <Button
              onClick={() => handleViewModeChange("custom")}
              variant={viewMode === "custom" ? "primary" : "outline"}
            >
              Custom Date
            </Button>
          </div>

          {viewMode === "custom" && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Date:
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <ComponentCard>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
            <UserIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white/90">{stats.total}</p>
        </ComponentCard>

        <ComponentCard className="bg-success-50 dark:bg-success-900/20 border-l-4 border-success-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-success-700 dark:text-success-400">Present</p>
            <CheckCircleIcon className="w-5 h-5 text-success-500" />
          </div>
          <p className="text-3xl font-bold text-success-600 dark:text-success-400">{stats.present}</p>
        </ComponentCard>

        <ComponentCard className="bg-error-50 dark:bg-error-900/20 border-l-4 border-error-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-error-700 dark:text-error-400">Absent</p>
            <span className="w-5 h-5 text-error-500 text-xl">×</span>
          </div>
          <p className="text-3xl font-bold text-error-600 dark:text-error-400">{stats.absent}</p>
        </ComponentCard>

        <ComponentCard className="bg-brand-50 dark:bg-brand-900/20 border-l-4 border-brand-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-brand-700 dark:text-brand-400">Attendance Rate</p>
            <span className="w-5 h-5 text-brand-500 text-xl">%</span>
          </div>
          <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">
            {stats.percentage}%
          </p>
        </ComponentCard>
      </div>

      {/* Attendance List */}
      <ComponentCard
        title={
          viewMode === "today"
            ? "Today's Attendance"
            : selectedDate
            ? `Attendance for ${new Date(selectedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}`
            : "Select a date to view attendance"
        }
      >
        {attendanceData.length === 0 ? (
          <div className="text-center py-8">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No team members found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attendanceData.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      member.hasMarkedAttendance ? "bg-success-500" : "bg-gray-400"
                    }`}
                  >
                    {member.name?.charAt(0).toUpperCase() || "?"}
                  </div>

                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {member.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                    <div className="text-xs text-gray-400 capitalize mt-0.5">
                      {member.role?.toLowerCase() || "Employee"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {member.hasMarkedAttendance ? (
                    <>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-success-600 font-medium">
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>Present</span>
                        </div>
                        {member.markedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Marked at{" "}
                            {new Date(member.markedAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <span className="text-xl">×</span>
                      <span className="font-medium">Absent</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}

