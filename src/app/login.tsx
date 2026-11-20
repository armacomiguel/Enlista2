import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { loginUser, registerUser } from '@/lib/firebase/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(email.trim(), password);
        router.replace('/(tabs)');
      } else {
        await registerUser(email.trim(), password);
        setSuccess('¡Cuenta creada! Redirigiendo...');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1500);
      }
    } catch (err: any) {
      const message = err?.message || 'Ocurrió un error';
      if (message.includes('user-not-found')) setError('No existe una cuenta con este email');
      else if (message.includes('wrong-password')) setError('Contraseña incorrecta');
      else if (message.includes('email-already-in-use')) setError('Ya existe una cuenta con este email');
      else if (message.includes('invalid-email')) setError('Email inválido');
      else if (message.includes('weak-password')) setError('La contraseña es muy débil');
      else setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Enlista</Text>
          <Text style={styles.subtitle}>
            Tu asistente de cocina y compras
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {!isLogin && (
            <Input
              label="Confirmar contraseña"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          )}

          <Button
            title={isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            onPress={handleSubmit}
            loading={loading}
            size="large"
            style={styles.submitButton}
          />

          <TouchableOpacity
            onPress={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
            style={styles.toggleContainer}
          >
            <Text style={styles.toggleText}>
              {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <Text style={styles.toggleLink}>
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.largeTitle,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.body,
  },
  successContainer: {
    backgroundColor: '#DCFCE7',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  successText: {
    color: Colors.success,
    fontSize: FontSizes.body,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  toggleText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
  toggleLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
