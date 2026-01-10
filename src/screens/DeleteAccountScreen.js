import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../styles/style';
import apiClient from '../utils/api-native.js';
import { useAuth } from '../context/AuthContext';
import { logoutAuth } from '../utils/services/authService';
import { CommonActions } from '@react-navigation/native';

const DeleteAccountScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Get auth context for logout functionality
    const auth = useAuth();
    const { logout } = auth;

    const handleGoBack = () => {
        console.log('Delete Account screen: Go back button pressed');

        try {
            if (navigation && navigation.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate('Me');
            }
        } catch (error) {
            console.error('Error going back:', error);
            navigation.navigate('Me');
        }
    };

    const handleDeleteAccount = async () => {
        // Validation
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        if (!password.trim()) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        // Show confirmation dialog
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => confirmDeleteAccount(),
                },
            ]
        );
    };

    const confirmDeleteAccount = async () => {
        setIsLoading(true);

        try {
            // Use the exact working configuration from Postman
            const response = await apiClient.delete('/auth/delete_user', {
                data: {
                    email: email.trim(),
                    password: password.trim(),
                }
            });

            if (response.data.success) {
                try {
                    // Logout user and clear authentication state
                    await logoutAuth();
                    await logout();

                    // Navigate to login screen and reset navigation stack
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        })
                    );
                } catch (logoutError) {
                    console.error('Logout error after account deletion:', logoutError);
                    // Even if logout fails, still navigate to login
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        })
                    );
                }
            } else {
                Alert.alert('Error', response.data.message || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Delete account error:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to delete account. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.reg_safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.reg_header}>
                        <TouchableOpacity
                            onPress={handleGoBack}
                            style={styles.backButton}
                            activeOpacity={0.6}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Icon name="arrow-back" size={26} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.reg_headerText}>Delete Account</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Content */}
                    <View style={styles.reg_content}>
                        <View style={styles.reg_formContainer}>
                            <Text style={styles.deleteAccountTitle}>Delete Your Account</Text>
                            <Text style={styles.deleteAccountDescription}>
                                To delete your account, please enter your email and password to confirm your identity.
                                This action is permanent and cannot be undone.
                            </Text>

                            {/* Email Input */}
                            <View style={[styles.reg_inputContainer, { margin: 12 }]}>
                                <Icon name="email" size={20} color="#666" style={styles.reg_inputIcon} />
                                <TextInput
                                    style={styles.reg_input_delete}
                                    placeholder="Email Address"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Password Input */}
                            <View style={[styles.reg_inputContainer, { margin: 12 }]}>
                                <Icon name="lock" size={20} color="#666" style={styles.reg_inputIcon} />
                                <TextInput
                                    style={styles.reg_input_delete}
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.reg_eyeButton}
                                >
                                    <Icon
                                        name={showPassword ? "visibility" : "visibility-off"}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Warning Text */}
                            <View style={styles.deleteWarningContainer}>
                                <Icon name="warning" size={20} color="#ff3b30" />
                                <Text style={styles.deleteWarningText}>
                                    Warning: This action will permanently delete your account and all associated data.
                                    This cannot be undone.
                                </Text>
                            </View>

                            {/* Delete Button */}
                            {isLoading ? (
                                <ActivityIndicator size="large" color="#ff3b30" style={{ marginVertical: 20 }} />
                            ) : (
                                <TouchableOpacity
                                    style={styles.deleteAccountButton}
                                    onPress={handleDeleteAccount}
                                >
                                    <Text style={styles.deleteAccountButtonText}>Confirm Delete Account</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default DeleteAccountScreen;
