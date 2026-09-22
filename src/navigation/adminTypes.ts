export type AdminTabKey = 'home' | 'tests' | 'students' | 'results' | 'more';

export type AdminRoute =
  | { name: 'tab'; tab: AdminTabKey }
  | { name: 'categories' }
  | { name: 'addCategory'; categoryId?: string }
  | { name: 'categoryDetail'; categoryId: string }
  | { name: 'seriesList' }
  | { name: 'createSeriesStep1'; seriesId?: string; category?: string }
  | { name: 'createSeriesStep2'; seriesId: string }
  | { name: 'seriesPreview'; seriesId: string }
  | { name: 'seriesTests'; seriesId: string }
  | { name: 'createTestStep1'; seriesId: string; testId?: string }
  | { name: 'createTestStep2'; testId: string }
  | { name: 'manageQuestions'; testId: string }
  | { name: 'questionBank'; testId?: string }
  | { name: 'addQuestion'; testId?: string; questionId?: string; subject?: string }
  | { name: 'questionPreview'; questionId: string; testId?: string }
  | { name: 'importQuestions'; testId: string }
  | { name: 'subjectSections'; testId: string }
  | { name: 'studentPreview'; testId: string }
  | { name: 'publishTest'; testId: string }
  | { name: 'publishSuccess'; testId: string }
  | { name: 'studentDetail'; studentId: string }
  | { name: 'resultsForTest'; testId: string; testTitle: string }
  | { name: 'notifications' }
  | { name: 'banners' }
  | { name: 'teacherInfo' }
  | { name: 'successStories' };

export type AdminNav = {
  push: (route: AdminRoute) => void;
  pop: () => void;
  replace: (route: AdminRoute) => void;
  resetToTab: (tab: AdminTabKey) => void;
};

const TESTS_TAB_ROUTES = new Set<AdminRoute['name']>([
  'categories',
  'addCategory',
  'categoryDetail',
  'seriesList',
  'createSeriesStep1',
  'createSeriesStep2',
  'seriesPreview',
  'seriesTests',
  'createTestStep1',
  'createTestStep2',
  'manageQuestions',
  'questionBank',
  'addQuestion',
  'questionPreview',
  'importQuestions',
  'subjectSections',
  'studentPreview',
  'publishTest',
  'publishSuccess',
]);

const NO_TAB_BAR_ROUTES = new Set<AdminRoute['name']>([
  'addCategory',
  'createSeriesStep1',
  'createSeriesStep2',
  'createTestStep1',
  'createTestStep2',
  'addQuestion',
]);

export const adminRouteTab = (route: AdminRoute): AdminTabKey | null => {
  if (route.name === 'tab') return route.tab;
  if (route.name === 'studentDetail') return 'students';
  if (route.name === 'resultsForTest') return 'results';
  if (TESTS_TAB_ROUTES.has(route.name)) return 'tests';
  return null;
};

export const adminShowsTabBar = (route: AdminRoute): boolean => !NO_TAB_BAR_ROUTES.has(route.name);
