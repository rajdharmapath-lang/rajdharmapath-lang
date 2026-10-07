import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
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

const PDF_FILE_NAME = 'RD chinese workbook.pdf';
const NOTE_FILES = [
  {
    id: 'foundation-notes',
    title: 'Foundation Notes',
    fileName: PDF_FILE_NAME,
    downloadPath: '/user/learning-pdf',
  },
];

export default function LearningPdfScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const [downloading, setDownloading] = useState(null);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [downloadError, setDownloadError] = useState(false);

  const handleDownload = async (files, downloadKey) => {
    if (downloading) return;
    setDownloading(downloadKey);
    setDownloadMessage('');
    setDownloadError(false);

    try {
      let selectedDirectory = null;

      if (Platform.OS === 'android') {
        const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permission.granted) {
          setDownloadMessage('Download canceled. Choose a folder to save the PDF.');
          return;
        }
        selectedDirectory = permission.directoryUri;
      }

      const downloadedFiles = [];
      for (const file of files) {
        const request = await getAuthenticatedDownloadRequest(file.downloadPath);
        const localUri = Platform.OS === 'android'
          ? `${FileSystem.cacheDirectory}${file.id}-${Date.now()}.pdf`
          : `${FileSystem.documentDirectory}${file.fileName}`;

        if (Platform.OS !== 'android' && (await FileSystem.getInfoAsync(localUri)).exists) {
          await FileSystem.deleteAsync(localUri, { idempotent: true });
        }

        const download = await FileSystem.downloadAsync(request.url, localUri, {
          headers: request.headers,
        });
        if (download.status < 200 || download.status >= 300) {
          if (download.status === 404) {
            throw new Error('The Notes download route or PDF was not found (404).');
          }
          if (download.status === 401) {
            throw new Error('Your session has expired. Sign in again, then retry the download.');
          }
          throw new Error(`Download failed with HTTP ${download.status}. Please try again.`);
        }

        if (Platform.OS === 'android') {
          const destination = await FileSystem.StorageAccessFramework.createFileAsync(
            selectedDirectory,
            file.fileName,
            'application/pdf'
          );
          const pdfContents = await FileSystem.readAsStringAsync(download.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await FileSystem.StorageAccessFramework.writeAsStringAsync(
            destination,
            pdfContents,
            { encoding: FileSystem.EncodingType.Base64 }
          );
          await FileSystem.deleteAsync(download.uri, { idempotent: true });
        } else {
          downloadedFiles.push(download.uri);
        }
      }

      if (Platform.OS === 'android') {
        setDownloadMessage(files.length === 1
          ? `${files[0].title} saved to the folder you selected.`
          : `${files.length} notes saved to the folder you selected.`);
      } else {
        if (!(await Sharing.isAvailableAsync())) {
          throw new Error('File sharing is not available on this device.');
        }
        for (const uri of downloadedFiles) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save or share the notes PDF',
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
      setDownloading(false);
    }
  };

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
            Keep your course notes on hand and study whenever you’re ready.
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
                  disabled={Boolean(downloading)}
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
            style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
            onPress={() => handleDownload(NOTE_FILES, 'all')}
            disabled={Boolean(downloading)}
            accessibilityRole="button"
          >
            {downloading === 'all' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#fff" />
            )}
            <Text style={styles.downloadButtonText}>
              {downloading === 'all' ? 'Downloading notes...' : 'Download All'}
            </Text>
          </Pressable>

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
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16 },
  statusText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.successGreen },
  errorText: { color: colors.failRed },
});