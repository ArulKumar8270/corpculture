import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { ReportListFilterValues } from '../utils/reportListApi';

type Props = {
  values: ReportListFilterValues;
  onChange: (patch: Partial<ReportListFilterValues>) => void;
  onApply: () => void;
  onClear: () => void;
  /** Start collapsed so report lists stay visible on small screens */
  defaultExpanded?: boolean;
};

const ReportListFilters = ({
  values,
  onChange,
  onApply,
  onClear,
  defaultExpanded = false,
}: Props) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const activeSummary = useMemo(() => {
    const parts: string[] = [];
    if (values.fromDate) parts.push(`From ${values.fromDate}`);
    if (values.toDate) parts.push(`To ${values.toDate}`);
    if (values.companyName?.trim()) parts.push(values.companyName.trim());
    if (values.assignedTo?.trim()) parts.push(values.assignedTo.trim());
    if (values.serialNo?.trim()) parts.push(`S/N ${values.serialNo.trim()}`);
    return parts.length ? parts.join(' · ') : 'No filters applied';
  }, [values]);

  return (
    <View style={styles.filterSection}>
      <TouchableOpacity
        style={styles.filterHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.filterHeaderText}>
          <Text style={styles.filterTitle}>Filters</Text>
          {!expanded ? (
            <Text style={styles.filterSummary} numberOfLines={1}>
              {activeSummary}
            </Text>
          ) : null}
        </View>
        <Icon
          name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color="#019ee3"
        />
      </TouchableOpacity>

      {expanded ? (
        <>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>From Date</Text>
            <TextInput
              style={styles.filterInput}
              value={values.fromDate}
              onChangeText={(text) => onChange({ fromDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>To Date</Text>
            <TextInput
              style={styles.filterInput}
              value={values.toDate}
              onChangeText={(text) => onChange({ toDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Company Name</Text>
            <TextInput
              style={styles.filterInput}
              value={values.companyName}
              onChangeText={(text) => onChange({ companyName: text })}
              placeholder="Company Name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Assigned To</Text>
            <TextInput
              style={styles.filterInput}
              value={values.assignedTo}
              onChangeText={(text) => onChange({ assignedTo: text })}
              placeholder="Assigned To"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Serial No</Text>
            <TextInput
              style={styles.filterInput}
              value={values.serialNo}
              onChangeText={(text) => onChange({ serialNo: text })}
              placeholder="Search material serial no"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.applyButton} onPress={onApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  filterSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterHeaderText: {
    flex: 1,
    paddingRight: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  filterSummary: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  filterRow: {
    marginTop: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  filterInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#333',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#019ee3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#019ee3',
  },
  clearButtonText: {
    color: '#019ee3',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ReportListFilters;
