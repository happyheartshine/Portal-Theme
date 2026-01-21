'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/apiClient';
import toast from '@/lib/toast';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';

export default function AdminPurgePage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [purging, setPurging] = useState(false);
  const [confirmationText, setConfirmationText] = useState<string>('');

  const handlePurge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMonth) {
      toast.error('Please select a month to purge');
      return;
    }

    if (confirmationText !== 'PURGE') {
      toast.error('Please type PURGE to confirm');
      return;
    }

    const monthDate = new Date(selectedMonth + '-01');
    const monthName = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    if (!confirm(`Are you absolutely sure you want to purge all data for ${monthName}? This action is IRREVERSIBLE and will permanently delete:\n\n- All orders\n- All refunds\n- All attendance records\n- All warnings\n- All coupons\n- All credit history\n\nThis data CANNOT be recovered!`)) {
      return;
    }

    try {
      setPurging(true);
      await adminApi.purgeData(selectedMonth);
      toast.success(`Successfully purged data for ${monthName}`);
      
      // Reset form
      setSelectedMonth('');
      setConfirmationText('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to purge data');
      console.error('Purge error:', error);
    } finally {
      setPurging(false);
    }
  };

  const getMaxMonth = (): string => {
    const now = new Date();
    // Only allow purging data from at least 3 months ago
    now.setMonth(now.getMonth() - 3);
    return now.toISOString().slice(0, 7);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Purge</h1>
        <p className="text-gray-500 mt-2 dark:text-gray-400">Clean up old data and manage system storage</p>
      </div>

      {/* Warning Banner */}
      <ComponentCard title="" className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
        <div className="flex items-start gap-3">
          <div className="text-red-600 text-3xl">⚠️</div>
          <div>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">
              DANGER ZONE - IRREVERSIBLE ACTION
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              This operation will <strong>PERMANENTLY DELETE</strong> all data for the selected month. 
              This includes orders, refunds, attendance, warnings, coupons, and credit history.
            </p>
            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
              <li>This action cannot be undone</li>
              <li>No backup will be created automatically</li>
              <li>All related records will be permanently removed</li>
              <li>Employee salary calculations for that month will be affected</li>
            </ul>
          </div>
        </div>
      </ComponentCard>

      {/* Purge Form */}
      <ComponentCard title="Purge Data">
        <form onSubmit={handlePurge} className="space-y-6">
          <div>
            <Label>
              Select Month to Purge <span className="text-red-500">*</span>
            </Label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              max={getMaxMonth()}
              disabled={purging}
              required
            />
            <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
              You can only purge data from at least 3 months ago to prevent accidental deletion of recent data.
            </p>
          </div>

          {selectedMonth && (
            <>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Data to be purged:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All records from{' '}
                  <strong>
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </strong>
                </p>
              </div>

              <div>
                <Label>
                  Type <strong className="text-red-600">PURGE</strong> to confirm <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type PURGE in capital letters"
                  disabled={purging}
                  required
                />
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                  This confirmation is required to prevent accidental deletions
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={purging || confirmationText !== 'PURGE'}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  {purging ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      <span>Purging Data...</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🗑️</span>
                      <span>Purge Data</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setSelectedMonth('');
                    setConfirmationText('');
                  }}
                  disabled={purging}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </form>
      </ComponentCard>

      {/* Information Box */}
      <ComponentCard title="" className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-2xl">ℹ️</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <h4 className="font-semibold mb-2">When to use Data Purge?</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>To comply with data retention policies</li>
              <li>To free up database storage space</li>
              <li>To remove old records that are no longer needed</li>
              <li>After archiving data to external storage</li>
            </ul>
            <p className="mt-3 font-semibold text-blue-700 dark:text-blue-400">
              Best Practice: Always create a backup before purging data!
            </p>
          </div>
        </div>
      </ComponentCard>

      {/* Usage Guidelines */}
      <ComponentCard title="Data Purge Guidelines">
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <p>
              <strong>Do:</strong> Verify all required reports have been generated before purging
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <p>
              <strong>Do:</strong> Create a database backup before performing purge operations
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <p>
              <strong>Do:</strong> Notify relevant stakeholders before purging data
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <p>
              <strong>Don't:</strong> Purge data from the current or previous month
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <p>
              <strong>Don't:</strong> Purge data without proper authorization
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <p>
              <strong>Don't:</strong> Rush the purge process - double-check everything first
            </p>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
}

