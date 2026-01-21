"use client";

import { useState, useEffect } from "react";
import { employeeApi } from "@/lib/apiClient";
import toast from "@/lib/toast";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { CalenderIcon } from "@/icons";

interface AttendanceRecord {
  id: string;
  dateKey: string;
  timestamp: string;
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getAttendance(currentMonth);
      setAttendance(response.data || []);
    } catch (error: any) {
      toast.error("Failed to load attendance records");
      console.error("Attendance error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      setMarking(true);
      await employeeApi.markAttendance();
      toast.success("Attendance marked successfully");
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark attendance");
      console.error("Mark attendance error:", error);
    } finally {
      setMarking(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const isMarkedToday = attendance.some((a) => a.dateKey === today);

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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Attendance</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Mark your daily attendance and view history
        </p>
      </div>

      {/* Mark Attendance Card */}
      <ComponentCard title="Mark Attendance">
        <Button
          onClick={handleMarkAttendance}
          disabled={isMarkedToday || marking}
          className="w-full"
          startIcon={<CalenderIcon />}
        >
          {isMarkedToday
            ? "Already Marked Today"
            : marking
            ? "Marking..."
            : "Mark Attendance for Today"}
        </Button>
      </ComponentCard>

      {/* Attendance History Card */}
      <ComponentCard title="Attendance History">
        <div className="space-y-2">
          {attendance && attendance.length > 0 ? (
            attendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
              >
                <span className="font-medium text-gray-800 dark:text-white/90">
                  {new Date(record.dateKey).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(record.timestamp).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-gray-500 dark:text-gray-400">
              No attendance records for this month
            </p>
          )}
        </div>
      </ComponentCard>
    </div>
  );
}

