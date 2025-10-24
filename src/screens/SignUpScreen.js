import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Snackbar, Checkbox } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { registerUser } from '../services/authService';

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(email, password, name);
      
      if (result.success) {
        // Navigation will be handled by AuthContext
        console.log('Sign up successful!');
      } else {
        setError(result.error || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      // TODO: Implement Google Sign-Up
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Navigation will be handled by AuthContext
      console.log('Google sign-up successful!');
    } catch (err) {
      setError('Google sign-up failed');
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to get started</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              theme={{ colors: { primary: '#667eea' } }}
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              theme={{ colors: { primary: '#667eea' } }}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={<TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)}
              />}
              theme={{ colors: { primary: '#667eea' } }}
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
              right={<TextInput.Icon 
                icon={showConfirmPassword ? "eye-off" : "eye"} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />}
              theme={{ colors: { primary: '#667eea' } }}
            />

            <View style={styles.checkboxContainer}>
              <Checkbox
                status={agreeToTerms ? 'checked' : 'unchecked'}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
                color="#667eea"
              />
              <Text style={styles.checkboxText}>
                I agree to the Terms & Conditions
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              style={styles.signUpButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              mode="outlined"
              onPress={handleGoogleSignUp}
              disabled={loading}
              style={styles.googleButton}
              icon="google"
              contentStyle={styles.buttonContent}
            >
              Sign Up with Google
            </Button>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('Login')}
                labelStyle={styles.loginText}
              >
                Sign In
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
    marginBottom: 30,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxText: {
    flex: 1,
    marginLeft: 8,
    color: '#666',
  },
  signUpButton: {
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
    color: '#666',
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
    color: '#666',
  },
  loginText: {
    color: '#667eea',
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
