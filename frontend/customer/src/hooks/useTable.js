import { useState } from 'react';
import { LAST_TABLE_KEY } from '../config/constants.js';
import {
  getQrTableCodeFromUrl,
  isQrExpired
} from '../utils/qr.js';
import { api } from '../services/api.js';

export function useTable() {
  const [tableCode, setTableCode] = useState(getQrTableCodeFromUrl());
  const [tableInfo, setTableInfo] = useState(null);
  const [tableError, setTableError] = useState('');
  const [tableLoading, setTableLoading] = useState(false);

  const resolveTable = async (code = tableCode) => {
    const cleanCode = String(code || '').trim();

    if (!cleanCode) {
      setTableInfo(null);
      setTableError('Mở link QR dạng /t/<mã-bàn> hoặc nhập mã bàn.');
      return null;
    }

    if (isQrExpired()) {
      setTableInfo(null);
      setTableError('Mã QR đã hết hạn. Vui lòng yêu cầu nhân viên tạo mã QR mới.');
      return null;
    }

    setTableLoading(true);

    try {
      const table = await api(
        `/api/public/tables/${encodeURIComponent(cleanCode)}`
      );

      setTableInfo(table);
      setTableCode(cleanCode);
      setTableError('');
      localStorage.setItem(LAST_TABLE_KEY, cleanCode);

      return table;
    } catch (err) {
      setTableInfo(null);
      setTableError(
        err.message || 'Không thể tải menu. Vui lòng thử lại.'
      );

      return null;
    } finally {
      setTableLoading(false);
    }
  };

  const clearTable = () => {
    setTableCode('');
    setTableInfo(null);
    setTableError('Mở link QR dạng /t/<mã-bàn> hoặc nhập mã bàn.');
    localStorage.removeItem(LAST_TABLE_KEY);
  };

  return {
    tableCode,
    setTableCode,
    tableInfo,
    tableError,
    tableLoading,
    resolveTable,
    clearTable
  };
}