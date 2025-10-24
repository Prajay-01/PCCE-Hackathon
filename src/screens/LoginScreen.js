import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { TextInput, Button, Text, Snackbar, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { loginUser } from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        // Navigation will be handled by AuthContext
        console.log('Login successful!');
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // TODO: Implement Google Sign-In
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Navigation will be handled by AuthContext
      console.log('Google sign-in successful!');
    } catch (err) {
      setError('Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" color="#667eea" />}
              theme={{ 
                colors: { 
                  primary: '#667eea',
                  text: '#000000',
                  placeholder: '#999999',
                  background: '#ffffff'
                } 
              }}
              textColor="#000000"
              placeholderTextColor="#999999"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" color="#667eea" />}
              right={<TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)}
                color="#667eea"
              />}
              theme={{ 
                colors: { 
                  primary: '#667eea',
                  text: '#000000',
                  placeholder: '#999999',
                  background: '#ffffff'
                } 
              }}
              textColor="#000000"
              placeholderTextColor="#999999"
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              mode="outlined"
              onPress={handleGoogleLogin}
              disabled={loading}
              style={styles.googleButton}
              icon="google"
              contentStyle={styles.buttonContent}
            >
              Continue with Google
            </Button>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('SignUp')}
                labelStyle={styles.signUpText}
              >
                Sign Up
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setError(''),
        }}
      >
        {error}
      </Snackbar>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#f0f0f0',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  loginButton: {
    marginTop: 10,
    backgroundColor: '#667eea',
    borderRadius: 10,
  },
  buttonContent: {
    height: 50,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#333',
    fontSize: 14,
  },
  googleButton: {
    borderColor: '#667eea',
    borderRadius: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#333',
    fontSize: 14,
  },
  signUpText: {
    color: '#667eea',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
