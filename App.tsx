import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, ToastAndroid, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BottomTabBar from './src/components/BottomTabBar';
import { Nav, Route, routeTab } from './src/navigation/types';
import EditProfileScreen from './src/screens/EditProfileScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import HomeScreen from './src/screens/HomeScreen';
import LandingScreen from './src/screens/LandingScreen';
import LanguagePreferenceScreen from './src/screens/LanguagePreferenceScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ResultsTabScreen from './src/screens/ResultsTabScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import SolutionReviewScreen from './src/screens/SolutionReviewScreen';
import TestInstructionsScreen from './src/screens/TestInstructionsScreen';
import TestListScreen from './src/screens/TestListScreen';
import TestResultScreen from './src/screens/TestResultScreen';
import TestTakingScreen from './src/screens/TestTakingScreen';
import TestsScreen from './src/screens/TestsScreen';
import AdminApp from './src/screens/admin/AdminApp';
import { AuthUser } from './src/services/auth.service';
import { LanguageProvider } from './src/context/LanguageContext';

type AuthScreen = 'landing' | 'signup' | 'login';

export default function App() {
  const [authScreen, setAuthScreen] = useState<AuthScreen>('landing');
  const [prefillEmail, setPrefillEmail] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stack, setStack] = useState<Route[]>([{ name: 'tab', tab: 'home' }]);
  const lastBackPressRef = useRef(0);

  const nav: Nav = {
    push: (route) => setStack((s) => [...s, route]),
    pop: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    replace: (route) => setStack((s) => [...s.slice(0, -1), route]),
    resetToTab: (tab) => setStack([{ name: 'tab', tab }]),
  };

  useEffect(() => {
    const onBackPress = () => {
      // 1. Auth Screens
      if (!user || !token) {
        if (authScreen === 'signup') {
          setAuthScreen('login');
          return true;
        }
        if (authScreen === 'login') {
          setAuthScreen('landing');
          return true;
        }
        // At landing: double tap back to exit
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPressRef.current = now;
        if (Platform.OS === 'android') {
          ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        }
        return true;
      }

      // 2. Admin app handles its own back actions
      if (user.role === 'admin') {
        return false;
      }

      // 3. Student Panel
      const current = stack[stack.length - 1];

      // A) If taking test: confirm before leaving
      if (current.name === 'testTaking') {
        Alert.alert(
          'Leave Test?',
          'Your answers so far have been saved. Are you sure you want to leave this test?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: () => nav.pop(),
            },
          ]
        );
        return true;
      }

      // B) If on nested screen (testList, testInstructions, notifications, language, editProfile, etc.)
      if (stack.length > 1) {
        nav.pop();
        return true;
      }

      // C) If on tab screen
      if (current.name === 'tab') {
        // If on Tests, Results, or Profile tab -> return to Home tab
        if (current.tab !== 'home') {
          nav.resetToTab('home');
          return true;
        }

        // If already on Home tab -> double tap to exit
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPressRef.current = now;
        if (Platform.OS === 'android') {
          ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        }
        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [user, token, authScreen, stack, nav]);

  if (!user || !token) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {authScreen === 'landing' && <LandingScreen onFinish={() => setAuthScreen('login')} />}
        {authScreen === 'signup' && (
          <SignUpScreen
            onBack={() => setAuthScreen('login')}
            onGoToLogin={() => setAuthScreen('login')}
            onSignUpSuccess={(result) => {
              setPrefillEmail(result.user.email);
              Alert.alert('Account created', 'Please login with your new account.');
              setAuthScreen('login');
            }}
          />
        )}
        {authScreen === 'login' && (
          <SignInScreen
            onGoToSignUp={() => setAuthScreen('signup')}
            initialEmail={prefillEmail}
            onLoginSuccess={(result) => {
              setUser(result.user);
              setToken(result.token);
              setStack([{ name: 'tab', tab: 'home' }]);
            }}
          />
        )}
      </SafeAreaProvider>
    );
  }

  const onLogout = () => {
    setUser(null);
    setToken(null);
    setAuthScreen('login');
  };

  if (user.role === 'admin') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AdminApp user={user} token={token} onLogout={onLogout} />
      </SafeAreaProvider>
    );
  }

  const current = stack[stack.length - 1];
  const activeTab = routeTab(current);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <LanguageProvider initialLanguage={user.preferredLanguage || 'English'}>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {current.name === 'tab' && current.tab === 'home' && (
              <HomeScreen user={user} token={token} nav={nav} onLogout={onLogout} />
            )}
            {current.name === 'tab' && current.tab === 'tests' && (
              <TestsScreen token={token} nav={nav} />
            )}
            {current.name === 'tab' && current.tab === 'results' && (
              <ResultsTabScreen token={token} nav={nav} />
            )}
            {current.name === 'tab' && current.tab === 'profile' && (
              <ProfileScreen token={token} nav={nav} onLogout={onLogout} />
            )}
            {current.name === 'testList' && (
              <TestListScreen token={token} category={current.category} nav={nav} />
            )}
            {current.name === 'testInstructions' && (
              <TestInstructionsScreen token={token} testId={current.testId} nav={nav} />
            )}
            {current.name === 'testTaking' && (
              <TestTakingScreen token={token} testId={current.testId} nav={nav} />
            )}
            {current.name === 'testResult' && (
              <TestResultScreen token={token} attemptId={current.attemptId} nav={nav} />
            )}
            {current.name === 'solutionReview' && (
              <SolutionReviewScreen token={token} attemptId={current.attemptId} nav={nav} />
            )}
            {current.name === 'leaderboard' && (
              <LeaderboardScreen token={token} testId={current.testId} nav={nav} />
            )}
            {current.name === 'editProfile' && <EditProfileScreen token={token} nav={nav} />}
            {current.name === 'notifications' && <NotificationsScreen token={token} nav={nav} />}
            {current.name === 'language' && <LanguagePreferenceScreen token={token} nav={nav} />}
            {current.name === 'help' && <HelpSupportScreen token={token} nav={nav} />}
          </View>

          {activeTab && <BottomTabBar active={activeTab} onChange={(tab) => nav.resetToTab(tab)} />}
        </View>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
