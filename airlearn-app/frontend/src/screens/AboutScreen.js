import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';

export default function AboutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>About</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.appIdentity}>
              <View style={styles.appIcon}>
                <Ionicons name="book-outline" size={30} color={colors.homeOrange} />
              </View>
              <Text style={styles.appName}>Raj Dharma</Text>
            </View>

            <Text style={styles.paragraph}>
              I am Raj Dharma, a passionate Chinese language educator dedicated to empowering our Tamil and Indian community through language and cultural learning.
            </Text>
            <Text style={styles.paragraph}>
              I had the privilege of studying and living in China for over seven years, where I deeply immersed myself in the Chinese language, culture, and way of life. Over time, I developed a strong command of the language along with a deep appreciation for the richness and diversity of Chinese traditions.
            </Text>
            <Text style={styles.paragraph}>
              My journey took me across many cities, including Beijing, Shanghai, Guangzhou, Shenzhen, Chengdu, Hangzhou, Suzhou, Xiamen, Chongqing, Qingdao, Weifang, Zhengzhou, Fuzhou, Haikou, Sanya, Zhuhai, and Hong Kong. I have also lived in Singapore and Malaysia, which strengthened my connection with our global Tamil community.
            </Text>
            <Text style={styles.paragraph}>
              My mission is to improve the quality of job opportunities and open new career paths for our Tamil and Indian brothers and sisters. Language is a powerful tool that can transform lives, create global connections, and lead to a better standard of living.
            </Text>
            <Text style={styles.paragraph}>
              I dedicate these teachings to our beloved Tamil ancestors who migrated, worked hard, and sacrificed so much. Their strength, resilience, and determination continue to inspire us every day.
            </Text>
            <Text style={styles.quote}>“Break language barriers. Build a better future.”</Text>
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
  scrollContent: { paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  title: { ...typography.h2, color: colors.accentRedAlt },
  headerSpacer: { width: 26 },
  card: {
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 16,
    padding: 24,
  },
  appIdentity: { alignItems: 'center' },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.homeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginBottom: 22 },
  paragraph: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textDark,
    marginBottom: 14,
  },
  quote: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    color: colors.accentRedAlt,
    textAlign: 'center',
    marginTop: 2,
  },
});
