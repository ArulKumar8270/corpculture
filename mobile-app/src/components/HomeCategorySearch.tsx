import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type Category = { _id?: string; name: string };

type Props = {
  categories: Category[];
  enabled?: boolean;
  showOnHome?: boolean;
  placeholder?: string;
  primaryColor?: string;
};

const HomeCategorySearch = ({
  categories,
  enabled,
  showOnHome,
  placeholder,
  primaryColor = '#019ee3',
}: Props) => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return categories.slice(0, 16);
    const q = query.toLowerCase();
    return categories.filter((c) => c.name?.toLowerCase().includes(q));
  }, [categories, query]);

  if (!enabled || !showOnHome || !categories.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.searchRow}>
        <Icon name="search" size={20} color="#666" />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder || 'Search categories...'}
          placeholderTextColor="#999"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No categories match</Text>
        ) : (
          filtered.map((cat) => (
            <TouchableOpacity
              key={cat._id || cat.name}
              style={[styles.chip, { borderColor: primaryColor }]}
              onPress={() =>
                (navigation as any).navigate('Products', { category: cat.name })
              }
            >
              <Text style={[styles.chipText, { color: primaryColor }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f5ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#333',
  },
  chips: {
    flexGrow: 0,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    fontSize: 13,
    color: '#666',
    paddingVertical: 4,
  },
});

export default HomeCategorySearch;
