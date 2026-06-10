import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ReportListFilterValues } from '../utils/reportListApi';

type Props = {
  values: ReportListFilterValues;
  onChange: (patch: Partial<ReportListFilterValues>) => void;
  onApply: () => void;
  onClear: () => void;
};

const ReportListFilters = ({ values, onChange, onApply, onClear }: Props) => (
  <View style={styles.filterSection}>
    <Text style={styles.filterTitle}>Filters</Text>

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
  </View>
);

const styles = StyleSheet.create({
  filterSection: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#019ee3',
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  filterInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
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
