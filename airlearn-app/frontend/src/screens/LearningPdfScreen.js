import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  NativeModules,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useResponsive } from '../theme/responsive';
import { getAuthenticatedDownloadRequest } from '../api/client';
import { usePayment } from '../context/PaymentContext';
import { redirectToPaywall } from '../utils/paywall';
import BottomNav from '../components/BottomNav';

const PDF_FILE_NAME = 'RD chinese workbook.pdf';
const NOTE_FILES = [
  {
    id: 'foundation-notes',
    title: 'Foundation Notes',
    fileName: PDF_FILE_NAME,
    downloadPath: '/user/learning-pdf',
  },
];

export default function LearningPdfScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { loaded, hasAnyBatchAccess } = usePayment();
  const [downloading, setDownloading] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [downloadError, setDownloadError] = useState(false);
  const canDownload = loaded && hasAnyBatchAccess();

  useEffect(() => {
    if (loaded && !hasAnyBatchAccess()) {
      redirectToPaywall(navigation, route);
    }
  }, [hasAnyBatchAccess, loaded, navigation, route]);

  const handleDownload = async (files, downloadKey) => {
    if (downloading) return;
    if (!loaded) {
      setDownloadMessage('Checking your purchase access. Please try again shortly.');
      setDownloadError(false);
      return;
    }
    if (!hasAnyBatchAccess()) {
      redirectToPaywall(navigation, route);
      return;
    }
    setDownloading(downloadKey);
    setDownloadProgress({ written: 0, expected: 0 });
    setDownloadMessage('');
    setDownloadError(false);
    const downloadedFiles = [];

    try {
      for (const file of files) {
        const request = await getAuthenticatedDownloadRequest(file.downloadPath);
        const localUri = `${FileSystem.cacheDirectory}${Date.now()}-${file.fileName}`;
        downloadedFiles.push({ uri: localUri, file });

        const downloadTask = FileSystem.createDownloadResumable(
          request.url,
          localUri,
          { headers: request.headers },
          ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
            setDownloadProgress({
              written: totalBytesWritten,
              expected: totalBytesExpectedToWrite,
            });
          }
        );
        const download = await downloadTask.downloadAsync();
        if (!download) {
          throw new Error('The PDF download did not complete. Please try again.');
        }
        if (download.status < 200 || download.status >= 300) {
          if (download.status === 404) {
            throw new Error('The Notes download route or PDF was not found (404).');
          }
          if (download.status === 401) {
            throw new Error('Your session has expired. Sign in again, then retry the download.');
          }
          throw new Error(`Download failed with HTTP ${download.status}. Please try again.`);
        }
        setDownloadProgress((progress) => progress && ({
          ...progress,
          written: progress.expected > 0 ? progress.expected : progress.written,
        }));
      }

      if (Platform.OS === 'android') {
        setDownloadProgress(null);
        const pdfSaver = NativeModules.PdfSave;
        if (!pdfSaver?.saveToLocation) {
          throw new Error('Save to device is unavailable. Install the latest app version and try again.');
        }

        let wasCancelled = false;
        for (const { uri, file } of downloadedFiles) {
          const result = await pdfSaver.saveToLocation(uri, file.fileName);
          if (result === 'cancelled') {
            wasCancelled = true;
            break;
          }
        }
        setDownloadMessage(wasCancelled
          ? 'Save canceled. The PDF was not saved.'
          : files.length === 1
            ? 'Foundation Notes saved to your selected location.'
            : `${files.length} notes saved to your selected locations.`);
        setDownloadError(false);
      } else {
        if (!(await Sharing.isAvailableAsync())) {
          throw new Error('File sharing is not available on this device.');
        }
        for (const { uri, file } of downloadedFiles) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Save or share ${file.title}`,
            UTI: 'com.adobe.pdf',
          });
        }
        setDownloadMessage(files.length === 1
          ? 'Foundation Notes are ready to save or share.'
          : `${files.length} notes are ready to save or share.`);
      }
    } catch (error) {
      setDownloadError(true);
      setDownloadMessage(error?.message || 'Could not download the PDF. Please try again.');
    } finally {
      await Promise.all(downloadedFiles.map(({ uri }) =>
        FileSystem.deleteAsync(uri, { idempotent: true }).catch((error) => {
          console.warn('[notes] Could not remove temporary PDF', error);
        })
      ));
      setDownloadProgress(null);
      setDownloading(false);
    }
  };

  const progressPercent = downloadProgress?.expected > 0
    ? Math.min(100, Math.floor((downloadProgress.written / downloadProgress.expected) * 100))
    : null;

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button">
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.headerTitle}>Notes</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconFrame}>
            <Image source={require('../../assets/Pdf_Icon.png')} style={styles.pdfIcon} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Your learning notes</Text>
          <Text style={styles.description}>
            Choose where to save your workbook PDF on your device.
          </Text>

          <View style={styles.fileList}>
            {NOTE_FILES.map((file) => (
              <View key={file.id} style={styles.fileRow}>
                <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{file.title}</Text>
                  <Text style={styles.fileType}>{file.fileName}</Text>
                </View>
                <Pressable
                  style={styles.fileDownloadButton}
                  onPress={() => handleDownload([file], file.id)}
                  disabled={Boolean(downloading) || !canDownload}
                  accessibilityRole="button"
                  accessibilityLabel={`Download ${file.title}`}
                >
                  {downloading === file.id ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Ionicons name="download-outline" size={22} color={colors.primary} />
                  )}
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable
            style={[
              styles.downloadButton,
              (downloading || !canDownload) && styles.downloadButtonDisabled,
            ]}
            onPress={() => handleDownload(NOTE_FILES, 'all')}
            disabled={Boolean(downloading) || !canDownload}
            accessibilityRole="button"
          >
            {downloading === 'all' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#fff" />
            )}
            <Text style={styles.downloadButtonText}>
              {downloading
                ? progressPercent === null
                  ? 'Downloading notes...'
                  : `Downloading notes... ${progressPercent}%`
                : 'Download All'}
            </Text>
          </Pressable>

          {Boolean(downloading) && downloadProgress && (
            <View style={styles.progressContainer} accessibilityLiveRegion="polite">
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    progressPercent !== null && { width: `${progressPercent}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {progressPercent === null
                  ? `${(downloadProgress.written / (1024 * 1024)).toFixed(1)} MB downloaded`
                  : `${(downloadProgress.written / (1024 * 1024)).toFixed(1)} of ${(downloadProgress.expected / (1024 * 1024)).toFixed(1)} MB`}
              </Text>
            </View>
          )}

          {!!downloadMessage && (
            <View style={styles.statusRow} accessibilityLiveRegion="polite">
              <Ionicons
                name={downloadError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={18}
                color={downloadError ? colors.failRed : colors.successGreen}
              />
              <Text style={[styles.statusText, downloadError && styles.errorText]}>
                {downloadMessage}
              </Text>
            </View>
          )}
        </View>
      </View>

      <BottomNav
        active="Videos"
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
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.accentRedAlt },
  headerSpacer: { width: 26 },
  content: { alignItems: 'center', paddingTop: 28 },
  iconFrame: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: colors.homeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pdfIcon: { width: 64, height: 64 },
  title: { fontSize: 22, fontWeight: '700', color: colors.accentRedAlt, textAlign: 'center' },
  description: { fontSize: 15, lineHeight: 22, color: colors.textLabel, textAlign: 'center', marginTop: 10 },
  fileRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.homeOrangeLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 32,
  },
  fileDetails: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  fileType: { fontSize: 12, color: colors.textLabel, marginTop: 4 },
  fileList: { width: '100%', marginTop: 32, gap: 12 },
  fileDownloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.homeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  downloadButton: {
    minHeight: 52,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 26,
    marginTop: 18,
  },
  downloadButtonDisabled: { opacity: 0.7 },
  downloadButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  progressContainer: { width: '100%', marginTop: 12 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.homeOrangeBg,
  },
  progressFill: {
    width: '4%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressText: { marginTop: 6, fontSize: 12, color: colors.textLabel, textAlign: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16 },
  statusText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.successGreen },
  errorText: { color: colors.failRed },
});