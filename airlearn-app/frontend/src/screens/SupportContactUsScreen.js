import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';

const CONTACTS = [
  {
    icon: 'call-outline',
    label: 'Phone',
    value: '8939107990',
    url: 'tel:8939107990',
  },
  {
    icon: 'logo-whatsapp',
    label: 'WhatsApp',
    value: '+91 89391 07990',
    url: 'https://wa.me/918939107990',
  },
  {
    icon: 'mail-outline',
    label: 'Email',
    value: 'rajdharmapath@gmail.com',
    url: 'mailto:rajdharmapath@gmail.com',
  },
];

export default function SupportContactUsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();

  const openContact = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Unable to open contact', error?.message || 'Please try again later.');
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={26} color={colors.border} />
            </Pressable>
            <Text style={styles.title}>Support & Contact Us</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Customer Support</Text>
            {CONTACTS.map((contact, index) => (
              <Pressable
                key={contact.label}
                style={[styles.contactRow, index < CONTACTS.length - 1 && styles.divider]}
                onPress={() => openContact(contact.url)}
                accessibilityRole="link"
                accessibilityLabel={`${contact.label}: ${contact.value}`}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={contact.icon} size={21} color={colors.homeOrange} />
                </View>
                <View style={styles.contactText}>
                  <Text style={styles.contactLabel}>{contact.label}</Text>
                  <Text style={styles.contactValue}>{contact.value}</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={colors.textLabel} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNav
        active="Profile"
        onNavigate={(key) => {
          if (key === 'Home') navigation.navigate('Home');
          if (key === 'Videos') navigation.navigate('BatchList');
          if (key === 'Language') navigation.navigate('Vocabulary');
          if (key === 'Profile') navigation.navigate('Settings');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center' },
  headerSpacer: { width: 26 },
  card: {
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    paddingTop: 14,
    paddingBottom: 8,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.strokeTrackLight },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.homeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactText: { flex: 1 },
  contactLabel: { fontSize: 13, color: colors.textLabel, marginBottom: 3 },
  contactValue: { fontSize: 15, fontWeight: '600', color: colors.textDark },
});
