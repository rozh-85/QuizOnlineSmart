import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, MIN_PIN_LENGTH } from '../constants/app';
import { useAuth } from '../context/AuthContext';
import { getDeviceFingerprint } from '../utils/device';
import { extractSerialFromInput } from '../utils/serial';

const LoginScreen = () => {
  const { signInWithSerial } = useAuth();
  const [serialId, setSerialId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const pinRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    const cleanedSerial = extractSerialFromInput(serialId);

    if (!cleanedSerial) {
      setError('Please enter your Student ID');
      shake();
      return;
    }
    if (pin.length < MIN_PIN_LENGTH) {
      setError(`PIN must be at least ${MIN_PIN_LENGTH} digits`);
      shake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fingerprint = await getDeviceFingerprint();
      await signInWithSerial(cleanedSerial, pin, fingerprint);
    } catch (e: any) {
      const msg = e?.message || 'Login failed. Please try again.';
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="flask" size={28} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>EduPulse</Text>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSub}>Sign in with your Student ID to continue</Text>
        </View>

        {/* Form Card */}
        <Animated.View style={[styles.formCard, { transform: [{ translateX: shakeAnim }] }]}>
          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.rose[500]} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Serial ID Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Student ID</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color={COLORS.slate[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your Student ID"
                placeholderTextColor={COLORS.slate[400]}
                value={serialId}
                onChangeText={(t) => { setSerialId(t); setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => pinRef.current?.focus()}
              />
            </View>
          </View>

          {/* PIN Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PIN</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.slate[400]} style={styles.inputIcon} />
              <TextInput
                ref={pinRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your PIN"
                placeholderTextColor={COLORS.slate[400]}
                value={pin}
                onChangeText={(t) => { setPin(t); setError(''); }}
                secureTextEntry={!showPin}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeBtn}>
                <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.slate[400]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
                <Text style={styles.loginBtnText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Contact your teacher if you forgot your credentials
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate[50],
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary[600],
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.slate[900],
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 15,
    color: COLORS.slate[500],
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.rose[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.rose[500],
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate[700],
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.slate[900],
  },
  eyeBtn: {
    padding: 4,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
    borderRadius: 12,
    height: 50,
    gap: 8,
    marginTop: 8,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: COLORS.slate[400],
    textAlign: 'center',
  },
});

export default LoginScreen;
