import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';

const TERMS_SECTIONS = [
  {
    title: '1. About these terms',
    paragraphs: [
      'These Terms & Conditions apply to your access to and use of the Raj Dharma language-learning app and related services. By creating an account or using the app, you agree to these terms. If you do not agree, do not use the app.',
    ],
  },
  {
    title: '2. Accounts and your responsibilities',
    paragraphs: [
      'You must provide accurate account information, keep your sign-in credentials and device secure, and promptly tell us if you suspect unauthorized access. You are responsible for activity performed through your account, subject to applicable law.',
      'Use the app lawfully and do not misuse, disrupt, reverse engineer, or attempt to gain unauthorized access to the app, its accounts, content, or services.',
    ],
  },
  {
    title: '3. Learning content and app features',
    paragraphs: [
      'Raj Dharma provides language-learning videos, vocabulary, pronunciation, stroke-writing, practice and quiz features, and related learning materials. Content is for learning and informational purposes. Learning outcomes vary by person, and we do not guarantee a particular level of proficiency, examination result, employment, or other outcome.',
      'You may use app content for your personal learning. Unless the law or our written permission allows it, you must not copy, redistribute, publicly share, sell, or create commercial works from our lessons or other protected content.',
    ],
  },
  {
    title: '4. Plans and payments',
    paragraphs: [
      'Available plans, prices, included features, and access duration are shown in the app before purchase. Access is tied to the plan and batch purchased and remains subject to the displayed validity period and these terms. A plan that includes Live Classes is required to access the live-class link.',
      'Payments are processed through the payment provider shown at checkout. Payment verification and access activation may depend on confirmation from that provider. Refunds, cancellations, and payment disputes are handled in accordance with applicable law and the terms presented by the payment provider; contact us if you need help with a purchase.',
    ],
  },
  {
    title: '5. Live Classes and Zoom',
    paragraphs: [
      'For eligible Live Class package holders, the Join Live link is made available from the 1st through the 10th of each month, between 6:00 PM and 8:00 PM India Standard Time, subject to service availability. The app opens the meeting through Zoom or a compatible browser. You must also follow Zoom’s terms and any instructions given by the class host.',
      'Zoom is a third-party service. We do not control its availability, features, privacy practices, or meeting conduct. Your use of Zoom, including any audio or video you choose to share, is governed by Zoom’s terms and privacy policy.',
    ],
  },
  {
    title: '6. Microphone and speech features',
    paragraphs: [
      'Speech Practice and some quiz questions may require microphone and speech-recognition permissions. Speech recognition is provided by services available on your device. You can deny or revoke permission in device settings, but speech features may then be unavailable. See our Privacy Policy for details about speech data and on-device storage.',
    ],
  },
  {
    title: '7. Availability and changes',
    paragraphs: [
      'We aim to keep the app available and accurate, but features, content, schedules, and third-party services may change or be temporarily unavailable for maintenance or other reasons. We may update, suspend, or discontinue a feature where reasonably necessary, subject to applicable law and any rights you have under your purchase.',
    ],
  },
  {
    title: '8. Account deletion',
    paragraphs: [
      'You may delete your account from Profile → Account. Deleting your account removes the active profile, but certain audit, payment, entitlement, or preview records may be retained as described in the Privacy Policy and as required for service, legal, accounting, payment, or security purposes.',
    ],
  },
  {
    title: '9. Disclaimers and liability',
    paragraphs: [
      'To the extent permitted by law, the app and its learning content are provided on an “as available” basis. Nothing in these terms limits a consumer right or other liability that cannot legally be excluded. To the extent permitted by law, we are not responsible for indirect or consequential loss arising from inability to use the app or from third-party services.',
    ],
  },
  {
    title: '10. Changes and contact',
    paragraphs: [
      'We may update these terms as the app or our services change. The latest version will be available in the app; continued use after an update takes effect means you accept the revised terms to the extent permitted by law.',
      'For questions about these terms, contact Raj Dharma at rajdharmapath@gmail.com or +91 89391 07990.',
    ],
  },
];

export default function TermsAndConditionsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>Terms & Conditions</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.effectiveDate}>Effective date: October 27, 2026</Text>
          <Text style={styles.intro}>
            These terms describe the rules for using Raj Dharma and its learning services.
          </Text>
          <View style={styles.card}>
            {TERMS_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.paragraphs.map((paragraph) => (
                  <Text key={paragraph} style={styles.paragraph}>
                    {paragraph}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

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
    marginBottom: 20,
  },
  title: { ...typography.h2, color: colors.accentRedAlt },
  headerSpacer: { width: 26 },
  scrollContent: { paddingBottom: 24 },
  effectiveDate: { ...typography.small, color: colors.textLabel, marginBottom: 8 },
  intro: { ...typography.body, color: colors.textDark, lineHeight: 23, marginBottom: 16 },
  card: {
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accentRedAlt,
    marginBottom: 8,
  },
  paragraph: { fontSize: 14, lineHeight: 21, color: colors.textDark, marginBottom: 10 },
});
