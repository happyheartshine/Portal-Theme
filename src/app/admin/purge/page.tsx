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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Data Purge</h1>
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
      <ComponentCard title="Purge Data" hoverable>
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
                  <strong className="text-gray-900 dark:text-white/90">
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </strong>
                </p>
              </div>

              <div>
                <Label>
                  Type <strong className="text-red-600 dark:text-red-400">PURGE</strong> to confirm <span className="text-red-500">*</span>
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
                  loading={purging}
                  variant="danger"
                  size="sm"
                >
                  {!purging && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-white"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6.54142 3.7915C6.54142 2.54886 7.54878 1.5415 8.79142 1.5415H11.2081C12.4507 1.5415 13.4581 2.54886 13.4581 3.7915V4.0415H15.6252H16.666C17.0802 4.0415 17.416 4.37729 17.416 4.7915C17.416 5.20572 17.0802 5.5415 16.666 5.5415H16.3752V8.24638V13.2464V16.2082C16.3752 17.4508 15.3678 18.4582 14.1252 18.4582H5.87516C4.63252 18.4582 3.62516 17.4508 3.62516 16.2082V13.2464V8.24638V5.5415H3.3335C2.91928 5.5415 2.5835 5.20572 2.5835 4.7915C2.5835 4.37729 2.91928 4.0415 3.3335 4.0415H4.37516H6.54142V3.7915ZM14.8752 13.2464V8.24638V5.5415H13.4581H12.7081H7.29142H6.54142H5.12516V8.24638V13.2464V16.2082C5.12516 16.6224 5.46095 16.9582 5.87516 16.9582H14.1252C14.5394 16.9582 14.8752 16.6224 14.8752 16.2082V13.2464ZM8.04142 4.0415H11.9581V3.7915C11.9581 3.37729 11.6223 3.0415 11.2081 3.0415H8.79142C8.37721 3.0415 8.04142 3.37729 8.04142 3.7915V4.0415ZM8.3335 7.99984C8.74771 7.99984 9.0835 8.33562 9.0835 8.74984V13.7498C9.0835 14.1641 8.74771 14.4998 8.3335 14.4998C7.91928 14.4998 7.5835 14.1641 7.5835 13.7498V8.74984C7.5835 8.33562 7.91928 7.99984 8.3335 7.99984ZM12.4168 8.74984C12.4168 8.33562 12.081 7.99984 11.6668 7.99984C11.2526 7.99984 10.9168 8.33562 10.9168 8.74984V13.7498C10.9168 14.1641 11.2526 14.4998 11.6668 14.4998C12.081 14.4998 12.4168 14.1641 12.4168 13.7498V8.74984Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                  {purging ? 'Purging Data...' : 'Purge Data'}
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
      <ComponentCard title="" className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500" hoverable>
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-2xl">ℹ️</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <h4 className="font-semibold mb-2 text-gray-800 dark:text-white/90">When to use Data Purge?</h4>
            <ul className="list-disc list-inside space-y-1">
              <li className="text-gray-700 dark:text-gray-300">To comply with data retention policies</li>
              <li className="text-gray-700 dark:text-gray-300">To free up database storage space</li>
              <li className="text-gray-700 dark:text-gray-300">To remove old records that are no longer needed</li>
              <li className="text-gray-700 dark:text-gray-300">After archiving data to external storage</li>
            </ul>
            <p className="mt-3 font-semibold text-blue-700 dark:text-blue-400">
              Best Practice: Always create a backup before purging data!
            </p>
          </div>
        </div>
      </ComponentCard>

      {/* Usage Guidelines */}
      <ComponentCard title="Data Purge Guidelines" hoverable>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <p>
              <strong className="text-gray-800 dark:text-white/90">Do:</strong> Verify all required reports have been generated before purging
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <p>
              <strong className="text-gray-800 dark:text-white/90">Do:</strong> Create a database backup before performing purge operations
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <p>
              <strong className="text-gray-800 dark:text-white/90">Do:</strong> Notify relevant stakeholders before purging data
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <p>
              <strong className="text-gray-800 dark:text-white/90">Don't:</strong> Purge data from the current or previous month
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <p>
              <strong className="text-gray-800 dark:text-white/90">Don't:</strong> Purge data without proper authorization
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <p>
              <strong className="text-gray-800 dark:text-white/90">Don't:</strong> Rush the purge process - double-check everything first
            </p>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
}

