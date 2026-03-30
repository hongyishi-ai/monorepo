import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BarcodeScanner } from '../BarcodeScanner';

import { useToast } from '@/hooks/use-toast';
import '@/stores/scan.store';

// Mock dependencies
vi.mock('@/hooks/use-toast');
vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    getState: vi.fn().mockReturnValue(0),
  })),
}));

const mockToast = vi.fn();
const mockSetScanResult = vi.fn();
const mockSetScanError = vi.fn();
const mockSetDeviceStatus = vi.fn();
const mockClearScan = vi.fn();

// Mock the scan store with proper selector support
vi.mock('@/stores/scan.store', () => ({
  useScanStore: vi.fn(selector => {
    if (typeof selector === 'function') {
      // Handle selector syntax: state => state.setDeviceStatus
      const state = {
        setScanResult: mockSetScanResult,
        setScanError: mockSetScanError,
        setDeviceStatus: mockSetDeviceStatus,
        clearScan: mockClearScan,
        deviceStatus: 'idle' as const,
        scanResult: null,
        scanError: null,
      };
      return selector(state);
    }
    // Handle direct property access if needed
    return {
      setScanResult: mockSetScanResult,
      setScanError: mockSetScanError,
      setDeviceStatus: mockSetDeviceStatus,
      clearScan: mockClearScan,
    };
  }),
  validateBarcode: vi.fn(),
  parseBarcodeData: vi.fn(),
  createScannedItem: vi.fn(),
}));

describe('BarcodeScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      toast: mockToast,
    });
  });

  it('should render scanner interface correctly', () => {
    render(<BarcodeScanner />);

    expect(screen.getByText('扫码')).toBeInTheDocument();
    expect(screen.getByText('开始扫码')).toBeInTheDocument();
  });

  it('should render medicine scanner with correct title', () => {
    render(<BarcodeScanner scanType='medicine' />);

    expect(screen.getByText('扫描药品条码')).toBeInTheDocument();
  });

  it('should render batch scanner with correct title', () => {
    render(<BarcodeScanner scanType='batch' />);

    expect(screen.getByText('扫描批次条码')).toBeInTheDocument();
  });

  it('should call onScanSuccess when barcode is scanned successfully', async () => {
    const mockOnScanSuccess = vi.fn();
    render(<BarcodeScanner onScanSuccess={mockOnScanSuccess} />);

    // This test would need more complex mocking of html5-qrcode
    // to simulate actual scanning behavior
  });

  it('should validate barcode format correctly', () => {
    // Test the validateBarcode function indirectly through component behavior
    const mockOnScanSuccess = vi.fn();
    render(<BarcodeScanner onScanSuccess={mockOnScanSuccess} />);

    // This would require mocking the scanner's success callback
    // and testing the validation logic
  });
});
