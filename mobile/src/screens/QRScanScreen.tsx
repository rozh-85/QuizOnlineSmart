import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/app';
import { attendanceApi } from '../api/attendanceApi';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

const QRScanScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<'scanning' | 'processing' | 'success' | 'error'>('scanning');
  const [message, setMessage] = useState('');
  const [scanned, setScanned] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate scan line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setStatus('processing');
    setMessage('Verifying attendance...');

    try {
      let token = data;
      const attendMatch = data.match(/\/attend\/([^/?#]+)/);
      if (attendMatch) token = attendMatch[1];

      const result = await attendanceApi.verifyAndJoin(token);
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Attendance recorded successfully!');
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to record attendance');
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message || 'Failed to verify attendance');
    }
  };

  const reset = () => {
    setScanned(false);
    setStatus('scanning');
    setMessage('');
  };

  if (!permission) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.permIcon}>
            <Ionicons name="camera-outline" size={32} color={COLORS.slate[400]} />
          </View>
          <Text style={styles.permTitle}>Camera Permission Required</Text>
          <Text style={styles.permSub}>We need camera access to scan QR codes for attendance</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Ionicons name="camera" size={18} color={COLORS.white} />
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {status === 'scanning' && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          {/* Overlay */}
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.scanBox}>
                {/* Corners */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                {/* Scan line */}
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [{
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, SCAN_SIZE - 4],
                        }),
                      }],
                    },
                  ]}
                />
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom}>
              <Text style={styles.scanText}>Point your camera at the QR code</Text>
            </View>
          </View>
        </View>
      )}

      {status === 'processing' && (
        <View style={styles.resultContainer}>
          <View style={[styles.resultIcon, { backgroundColor: COLORS.primary[50] }]}>
            <ActivityIndicator size="large" color={COLORS.primary[600]} />
          </View>
          <Text style={styles.resultTitle}>Processing...</Text>
          <Text style={styles.resultMessage}>{message}</Text>
        </View>
      )}

      {status === 'success' && (
        <View style={styles.resultContainer}>
          <View style={[styles.resultIcon, { backgroundColor: COLORS.emerald[50] }]}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.emerald[500]} />
          </View>
          <Text style={styles.resultTitle}>Attendance Confirmed!</Text>
          <Text style={[styles.resultMessage, { color: COLORS.emerald[600] }]}>{message}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.primaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.resultContainer}>
          <View style={[styles.resultIcon, { backgroundColor: COLORS.rose[50] }]}>
            <Ionicons name="close-circle" size={48} color={COLORS.rose[500]} />
          </View>
          <Text style={styles.resultTitle}>Scan Failed</Text>
          <Text style={[styles.resultMessage, { color: COLORS.rose[500] }]}>{message}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
            <Ionicons name="refresh" size={18} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tips */}
      {status === 'scanning' && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips</Text>
          <Text style={styles.tipText}>1. Hold your phone steady</Text>
          <Text style={styles.tipText}>2. Make sure the QR code is well-lit</Text>
          <Text style={styles.tipText}>3. Align the QR code within the frame</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate[900] },
  centeredContainer: {
    flex: 1,
    backgroundColor: COLORS.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cameraContainer: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row' },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanBox: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 24,
  },
  scanText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  scanLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: COLORS.primary[400],
    borderRadius: 1,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: COLORS.white,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  resultContainer: {
    flex: 1,
    backgroundColor: COLORS.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.slate[900],
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: COLORS.slate[500],
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 32,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  permissionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  permIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.slate[50],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  permTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate[900],
    marginBottom: 6,
  },
  permSub: {
    fontSize: 13,
    color: COLORS.slate[500],
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  permBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
  },
  permBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  tipsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate[700],
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: COLORS.slate[500],
    lineHeight: 20,
  },
});

export default QRScanScreen;
