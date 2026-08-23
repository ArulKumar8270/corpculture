import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';

export const REPORT_ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50] as const;

type Props = {
  page: number; // 0-based
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  rowsPerPageOptions?: readonly number[];
  /** Hide when no results; default true */
  hideWhenEmpty?: boolean;
};

/**
 * Shared pagination bar for Admin report screens (web-parity look).
 */
const ReportPagination = ({
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = REPORT_ROWS_PER_PAGE_OPTIONS,
  hideWhenEmpty = true,
}: Props) => {
  if (hideWhenEmpty && totalCount <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(rowsPerPage, 1)));
  const startItem = totalCount === 0 ? 0 : page * rowsPerPage + 1;
  const endItem = Math.min((page + 1) * rowsPerPage, totalCount);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <View style={styles.container}>
      <Text style={styles.rangeText}>
        Showing {startItem}–{endItem} of {totalCount}
      </Text>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.navBtn, !canPrev && styles.navBtnDisabled]}
          onPress={() => canPrev && onPageChange(page - 1)}
          disabled={!canPrev}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-left" size={26} color={canPrev ? '#019ee3' : '#c5c5c5'} />
        </TouchableOpacity>

        <View style={styles.pagePill}>
          <Text style={styles.pagePillText}>
            Page {Math.min(page + 1, totalPages)} / {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navBtn, !canNext && styles.navBtnDisabled]}
          onPress={() => canNext && onPageChange(page + 1)}
          disabled={!canNext}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-right" size={26} color={canNext ? '#019ee3' : '#c5c5c5'} />
        </TouchableOpacity>
      </View>

      {onRowsPerPageChange ? (
        <View style={styles.rowsRow}>
          <Text style={styles.rowsLabel}>Rows</Text>
          <View style={styles.rowsOptions}>
            {rowsPerPageOptions.map((opt) => {
              const active = rowsPerPage === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.rowsChip, active && styles.rowsChipActive]}
                  onPress={() => {
                    if (opt !== rowsPerPage) onRowsPerPageChange(opt);
                  }}
                >
                  <Text style={[styles.rowsChipText, active && styles.rowsChipTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  rangeText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef8fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    backgroundColor: '#f3f3f3',
  },
  pagePill: {
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#019ee3',
    alignItems: 'center',
  },
  pagePillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  rowsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  rowsOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  rowsChip: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  rowsChipActive: {
    backgroundColor: '#019ee3',
    borderColor: '#019ee3',
  },
  rowsChipText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
  },
  rowsChipTextActive: {
    color: '#fff',
  },
});

export default ReportPagination;
