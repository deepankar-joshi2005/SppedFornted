import { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, ToastAndroid, View } from 'react-native';
import AdminBottomTabBar from '../../components/admin/AdminBottomTabBar';
import { AdminNav, AdminRoute, adminRouteTab, adminShowsTabBar } from '../../navigation/adminTypes';
import { AuthUser } from '../../services/auth.service';
import AdminHomeScreen from './AdminHomeScreen';
import AdminCategoriesScreen from './AdminCategoriesScreen';
import AdminAddCategoryScreen from './AdminAddCategoryScreen';
import AdminCategoryDetailScreen from './AdminCategoryDetailScreen';
import AdminStudentsScreen from './AdminStudentsScreen';
import AdminStudentDetailScreen from './AdminStudentDetailScreen';
import AdminNotificationsScreen from './AdminNotificationsScreen';
import AdminResultsScreen from './AdminResultsScreen';
import AdminResultsForTestScreen from './AdminResultsForTestScreen';
import AdminMoreScreen from './AdminMoreScreen';
import AdminSeriesListScreen from './AdminSeriesListScreen';
import AdminCreateSeriesStep1Screen from './AdminCreateSeriesStep1Screen';
import AdminCreateSeriesStep2Screen from './AdminCreateSeriesStep2Screen';
import AdminSeriesPreviewScreen from './AdminSeriesPreviewScreen';
import AdminSeriesTestsScreen from './AdminSeriesTestsScreen';
import AdminCreateTestStep1Screen from './AdminCreateTestStep1Screen';
import AdminCreateTestStep2Screen from './AdminCreateTestStep2Screen';
import AdminManageQuestionsScreen from './AdminManageQuestionsScreen';
import AdminQuestionBankScreen from './AdminQuestionBankScreen';
import AdminAddQuestionScreen from './AdminAddQuestionScreen';
import AdminQuestionPreviewScreen from './AdminQuestionPreviewScreen';
import AdminImportQuestionsScreen from './AdminImportQuestionsScreen';
import AdminSubjectSectionsScreen from './AdminSubjectSectionsScreen';
import AdminStudentPreviewScreen from './AdminStudentPreviewScreen';
import AdminPublishTestScreen from './AdminPublishTestScreen';
import AdminPublishSuccessScreen from './AdminPublishSuccessScreen';
import AdminBannersScreen from './AdminBannersScreen';
import AdminTeacherInfoScreen from './AdminTeacherInfoScreen';
import AdminSuccessStoriesScreen from './AdminSuccessStoriesScreen';
import AdminPYQScreen from './AdminPYQScreen';
import AdminEBooksScreen from './AdminEBooksScreen';
import AdminSectionalScreen from './AdminSectionalScreen';
import AdminSocialMediaScreen from './AdminSocialMediaScreen';

type Props = {
  user: AuthUser;
  token: string;
  onLogout: () => void;
};

export default function AdminApp({ user, token, onLogout }: Props) {
  const [stack, setStack] = useState<AdminRoute[]>([{ name: 'tab', tab: 'home' }]);
  const lastBackPressRef = useRef(0);

  const nav: AdminNav = {
    push: (route) => setStack((s) => [...s, route]),
    pop: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    replace: (route) => setStack((s) => [...s.slice(0, -1), route]),
    resetToTab: (tab) => setStack([{ name: 'tab', tab }]),
  };

  useEffect(() => {
    const onBackPress = () => {
      const current = stack[stack.length - 1];
      if (stack.length > 1) {
        nav.pop();
        return true;
      }
      if (current.name === 'tab') {
        if (current.tab !== 'home') {
          nav.resetToTab('home');
          return true;
        }
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
  }, [stack, nav]);

  const current = stack[stack.length - 1];
  const activeTab = adminRouteTab(current);
  const showTabBar = adminShowsTabBar(current);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {current.name === 'tab' && current.tab === 'home' && (
          <AdminHomeScreen user={user} token={token} nav={nav} onLogout={onLogout} />
        )}
        {current.name === 'tab' && current.tab === 'tests' && (
          <AdminCategoriesScreen token={token} nav={nav} />
        )}
        {current.name === 'tab' && current.tab === 'students' && (
          <AdminStudentsScreen token={token} nav={nav} />
        )}
        {current.name === 'tab' && current.tab === 'results' && (
          <AdminResultsScreen token={token} nav={nav} />
        )}
        {current.name === 'tab' && current.tab === 'pyq' && (
          <AdminPYQScreen token={token} nav={nav} />
        )}
        {current.name === 'tab' && current.tab === 'ebooks' && (
          <AdminEBooksScreen token={token} nav={nav} />
        )}
        {current.name === 'tab' && current.tab === 'sectional' && (
          <AdminSectionalScreen token={token} nav={nav} />
        )}
        {current.name === 'tab' && current.tab === 'more' && (
          <AdminMoreScreen user={user} onLogout={onLogout} />
        )}

        {current.name === 'categories' && <AdminCategoriesScreen token={token} nav={nav} />}
        {current.name === 'addCategory' && (
          <AdminAddCategoryScreen token={token} categoryId={current.categoryId} nav={nav} />
        )}
        {current.name === 'categoryDetail' && (
          <AdminCategoryDetailScreen token={token} categoryId={current.categoryId} nav={nav} />
        )}
        {current.name === 'studentDetail' && (
          <AdminStudentDetailScreen token={token} studentId={current.studentId} nav={nav} />
        )}
        {current.name === 'notifications' && (
          <AdminNotificationsScreen token={token} nav={nav} />
        )}
        {current.name === 'resultsForTest' && (
          <AdminResultsForTestScreen
            token={token}
            testId={current.testId}
            testTitle={current.testTitle}
            nav={nav}
          />
        )}

        {current.name === 'seriesList' && <AdminSeriesListScreen token={token} nav={nav} />}
        {current.name === 'sectional' && <AdminSectionalScreen token={token} nav={nav} />}
        {current.name === 'createSeriesStep1' && (
          <AdminCreateSeriesStep1Screen
            token={token}
            seriesId={current.seriesId}
            initialCategory={current.category}
            kind={current.kind}
            nav={nav}
          />
        )}
        {current.name === 'createSeriesStep2' && (
          <AdminCreateSeriesStep2Screen token={token} seriesId={current.seriesId} nav={nav} />
        )}
        {current.name === 'seriesPreview' && (
          <AdminSeriesPreviewScreen token={token} seriesId={current.seriesId} nav={nav} />
        )}
        {current.name === 'seriesTests' && (
          <AdminSeriesTestsScreen token={token} seriesId={current.seriesId} nav={nav} />
        )}
        {current.name === 'createTestStep1' && (
          <AdminCreateTestStep1Screen
            token={token}
            seriesId={current.seriesId}
            testId={current.testId}
            nav={nav}
          />
        )}
        {current.name === 'createTestStep2' && (
          <AdminCreateTestStep2Screen token={token} testId={current.testId} nav={nav} />
        )}
        {current.name === 'manageQuestions' && (
          <AdminManageQuestionsScreen token={token} testId={current.testId} nav={nav} />
        )}
        {current.name === 'questionBank' && (
          <AdminQuestionBankScreen token={token} testId={current.testId} nav={nav} />
        )}
        {current.name === 'addQuestion' && (
          <AdminAddQuestionScreen
            token={token}
            testId={current.testId}
            questionId={current.questionId}
            initialSubject={current.subject}
            nav={nav}
          />
        )}
        {current.name === 'questionPreview' && (
          <AdminQuestionPreviewScreen
            token={token}
            questionId={current.questionId}
            testId={current.testId}
            nav={nav}
          />
        )}
        {current.name === 'importQuestions' && (
          <AdminImportQuestionsScreen token={token} testId={current.testId} nav={nav} />
        )}
        {current.name === 'subjectSections' && (
          <AdminSubjectSectionsScreen token={token} testId={current.testId} nav={nav} />
        )}
        {current.name === 'studentPreview' && (
          <AdminStudentPreviewScreen token={token} testId={current.testId} nav={nav} />
        )}
        {current.name === 'publishTest' && (
          <AdminPublishTestScreen token={token} testId={current.testId} nav={nav} />
        )}
        {current.name === 'publishSuccess' && (
          <AdminPublishSuccessScreen token={token} testId={current.testId} nav={nav} />
        )}
        {current.name === 'banners' && <AdminBannersScreen token={token} nav={nav} />}
        {current.name === 'teacherInfo' && <AdminTeacherInfoScreen token={token} nav={nav} />}
        {current.name === 'successStories' && <AdminSuccessStoriesScreen token={token} nav={nav} />}
        {current.name === 'pyq' && <AdminPYQScreen token={token} nav={nav} />}
        {current.name === 'ebooks' && <AdminEBooksScreen token={token} nav={nav} />}
        {current.name === 'socialMedia' && <AdminSocialMediaScreen token={token} nav={nav} />}
      </View>

      {showTabBar && activeTab && (
        <AdminBottomTabBar active={activeTab} onChange={(tab) => nav.resetToTab(tab)} />
      )}
    </View>
  );
}
