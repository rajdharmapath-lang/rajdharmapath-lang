import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { countryCodes } from '../data/countryCodes';

export default function CountryCodePicker({ selected, onSelect }) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return countryCodes;
    const q = query.trim().toLowerCase();
    return countryCodes.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q)
    );
  }, [query]);

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={styles.dialCode}>{selected.dialCode}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.border} style={{ marginLeft: 4 }} />
      </Pressable>

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country Code</Text>
            <Pressable onPress={() => setVisible(false)} hitSlop={12}>
              <Ionicons name="close" size={26} color={colors.textDark} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textPlaceholder} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search country or code"
              placeholderTextColor={colors.textPlaceholder}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.iso2}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => {
                  onSelect(item);
                  setQuery('');
                  setVisible(false);
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowCode}>{item.dialCode}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  flag: { fontSize: 18, marginRight: 6 },
  dialCode: { fontSize: 16, color: colors.textDark, fontWeight: '500' },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: colors.textDark },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowName: { flex: 1, fontSize: 15, color: colors.textDark, marginLeft: 10 },
  rowCode: { fontSize: 15, color: colors.textLabel, fontWeight: '500' },
  separator: { height: 1, backgroundColor: colors.borderLight, marginLeft: 20 },
});
