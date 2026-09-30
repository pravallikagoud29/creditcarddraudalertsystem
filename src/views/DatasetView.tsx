// ============================================================================
// Dataset view — generate, load, and inspect transaction data
// ============================================================================

import { useState, useRef } from 'react';
import {
  Database,
  Upload,
  Download,
  RefreshCw,
  Table2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAppState } from '@/store/AppState';
import { Card, CardHeader, StatCard, Badge, Spinner } from '@/components/ui';
import { DonutChart } from '@/components/charts/DonutChart';
import { Histogram } from '@/components/charts/Histogram';
import { formatPercent, formatNumber } from '@/ml/stats';
import { parseCsv, downloadCsv } from '@/ml/csv';
import { RawTransaction } from '@/ml/types';

export function DatasetView() {
  const { rawData, datasetInfo, isGenerating, generateDataset, loadCsvData, setCurrentView } = useAppState();
  const [rows, setRows] = useState(2000);
  const [fraudRate, setFraudRate] = useState(0.05);
  const [seed, setSeed] = useState(42);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    generateDataset(rows, fraudRate, seed);
    setShowPreview(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      if (parsed.length > 0) {
        loadCsvData(parsed);
        setShowPreview(true);
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (rawData.length > 0) {
      downloadCsv(rawData.slice(0, 1000), 'credit_card_transactions.csv');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-ink-100 mb-1">Dataset Management</h2>
        <p className="text-sm text-ink-500">
          Generate a synthetic credit card transaction dataset or upload your own CSV file.
        </p>
      </div>

      {/* Generation controls */}
      <Card>
        <CardHeader
          title="Generate Dataset"
          subtitle="Create synthetic transactions mimicking the ULB creditcard.csv structure"
          icon={<Database size={18} />}
        />
        <div className="p-5 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-ink-400 font-medium block mb-1.5">
                Number of Rows
              </label>
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(Math.max(100, Math.min(10000, Number(e.target.value))))}
                className="input w-full"
                min={100}
                max={10000}
              />
            </div>
            <div>
              <label className="text-xs text-ink-400 font-medium block mb-1.5">
                Fraud Rate ({(fraudRate * 100).toFixed(1)}%)
              </label>
              <input
                type="range"
                value={fraudRate}
                onChange={(e) => setFraudRate(Number(e.target.value))}
                min={0.01}
                max={0.2}
                step={0.01}
                className="w-full accent-primary-500"
              />
            </div>
            <div>
              <label className="text-xs text-ink-400 font-medium block mb-1.5">
                Random Seed
              </label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="input w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary w-full"
              >
                {isGenerating ? <Spinner size={16} /> : <RefreshCw size={16} />}
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-ink-800">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary"
            >
              <Upload size={16} /> Upload CSV
            </button>
            <button
              onClick={handleDownload}
              disabled={rawData.length === 0}
              className="btn-secondary"
            >
              <Download size={16} /> Export Sample
            </button>
            <span className="text-xs text-ink-500 ml-auto">
              CSV format: Time, V1-V28, Amount, Class
            </span>
          </div>
        </div>
      </Card>

      {/* Dataset info */}
      {datasetInfo && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Rows"
              value={datasetInfo.totalRows.toLocaleString()}
              icon={<Table2 size={16} />}
            />
            <StatCard
              label="Total Columns"
              value={datasetInfo.totalCols}
              icon={<FileSpreadsheet size={16} />}
              color="accent"
            />
            <StatCard
              label="Fraud Cases"
              value={datasetInfo.fraudCount.toLocaleString()}
              icon={<AlertTriangle size={16} />}
              color="danger"
            />
            <StatCard
              label="Normal Cases"
              value={datasetInfo.normalCount.toLocaleString()}
              icon={<CheckCircle2 size={16} />}
              color="success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Class distribution */}
            <Card>
              <CardHeader title="Class Distribution" subtitle="Normal vs Fraud" />
              <div className="p-5 pt-4 flex justify-center">
                <DonutChart
                  data={[
                    { label: 'Normal', value: datasetInfo.normalCount, color: '#22c55e' },
                    { label: 'Fraud', value: datasetInfo.fraudCount, color: '#ef4444' },
                  ]}
                  centerValue={formatPercent(datasetInfo.fraudRate, 2)}
                  centerLabel="Fraud Rate"
                />
              </div>
            </Card>

            {/* Amount distribution */}
            <Card>
              <CardHeader title="Amount Distribution" subtitle="Histogram of transaction amounts" />
              <div className="p-5 pt-4">
                <Histogram values={rawData.map((d) => d.Amount)} bins={30} color="#f97316" height={160} />
                <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                  <div>
                    <span className="text-ink-500">Min</span>
                    <p className="text-ink-200 font-medium tabular-nums">
                      ${datasetInfo.amountStats.min.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-ink-500">Mean</span>
                    <p className="text-ink-200 font-medium tabular-nums">
                      ${datasetInfo.amountStats.mean.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-ink-500">Max</span>
                    <p className="text-ink-200 font-medium tabular-nums">
                      ${datasetInfo.amountStats.max.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Data quality */}
            <Card>
              <CardHeader title="Data Quality" subtitle="Missing values & duplicates" />
              <div className="p-5 pt-4 space-y-3">
                <QualityRow
                  label="Missing Values"
                  value={datasetInfo.missingValues}
                  good={datasetInfo.missingValues === 0}
                />
                <QualityRow
                  label="Duplicate Rows"
                  value={datasetInfo.duplicateRows}
                  good={datasetInfo.duplicateRows === 0}
                />
                <QualityRow
                  label="Feature Columns"
                  value={30}
                  good={true}
                />
                <QualityRow
                  label="Time Range"
                  value={`${(datasetInfo.timeStats.max / 3600).toFixed(1)} hrs`}
                  good={true}
                />
                <div className="pt-2 border-t border-ink-800">
                  <button
                    onClick={() => setCurrentView('preprocessing')}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    Proceed to Preprocessing →
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Data preview table */}
          {showPreview && (
            <Card>
              <CardHeader
                title="Data Preview"
                subtitle={`First 10 rows of ${rawData.length.toLocaleString()} total`}
                icon={<Table2 size={18} />}
              />
              <div className="p-5 pt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-ink-800">
                      <th className="text-left py-2 px-2 text-ink-500 font-medium">Time</th>
                      <th className="text-right py-2 px-2 text-ink-500 font-medium">V1</th>
                      <th className="text-right py-2 px-2 text-ink-500 font-medium">V2</th>
                      <th className="text-right py-2 px-2 text-ink-500 font-medium">V3</th>
                      <th className="text-right py-2 px-2 text-ink-500 font-medium">V4</th>
                      <th className="text-right py-2 px-2 text-ink-500 font-medium">V14</th>
                      <th className="text-right py-2 px-2 text-ink-500 font-medium">Amount</th>
                      <th className="text-center py-2 px-2 text-ink-500 font-medium">Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b border-ink-800/50 hover:bg-ink-800/30">
                        <td className="py-1.5 px-2 text-ink-300 tabular-nums">{row.Time}</td>
                        <td className="py-1.5 px-2 text-right text-ink-300 tabular-nums">{formatNumber(row.V1, 4)}</td>
                        <td className="py-1.5 px-2 text-right text-ink-300 tabular-nums">{formatNumber(row.V2, 4)}</td>
                        <td className="py-1.5 px-2 text-right text-ink-300 tabular-nums">{formatNumber(row.V3, 4)}</td>
                        <td className="py-1.5 px-2 text-right text-ink-300 tabular-nums">{formatNumber(row.V4, 4)}</td>
                        <td className="py-1.5 px-2 text-right text-ink-300 tabular-nums">{formatNumber(row.V14, 4)}</td>
                        <td className="py-1.5 px-2 text-right text-ink-200 tabular-nums font-medium">
                          ${row.Amount.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {row.Class === 1 ? (
                            <Badge variant="danger">Fraud</Badge>
                          ) : (
                            <Badge variant="success">Normal</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function QualityRow({
  label,
  value,
  good,
}: {
  label: string;
  value: number | string;
  good: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-400">{label}</span>
      <div className="flex items-center gap-1.5">
        {good ? (
          <CheckCircle2 size={12} className="text-success-400" />
        ) : (
          <AlertTriangle size={12} className="text-warning-400" />
        )}
        <span className={`text-xs font-medium tabular-nums ${good ? 'text-ink-200' : 'text-warning-400'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
    </div>
  );
}
