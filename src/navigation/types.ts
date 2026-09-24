export type TabKey = 'home' | 'tests' | 'results' | 'profile';

export type Route =
  | { name: 'tab'; tab: TabKey }
  | { name: 'testList'; category: string }
  | { name: 'testInstructions'; testId: string }
  | { name: 'testTaking'; attemptId: string; testId: string; language?: 'Hindi' | 'English' }
  | { name: 'testResult'; attemptId: string }
  | { name: 'solutionReview'; attemptId: string }
  | { name: 'leaderboard'; testId: string }
  | { name: 'editProfile' }
  | { name: 'notifications' }
  | { name: 'language' }
  | { name: 'help' }
  | { name: 'studentReviews' }
  | { name: 'pdfViewer'; title: string; fileUrl: string }
  | { name: 'pypsCategories' }
  | { name: 'pypsExams'; category: string }
  | { name: 'pypsPapers'; category: string; examName: string }
  | { name: 'ebooks' }
  | { name: 'freeTests' };

export type Nav = {
  push: (route: Route) => void;
  pop: () => void;
  replace: (route: Route) => void;
  resetToTab: (tab: TabKey) => void;
};

export const routeTab = (route: Route): TabKey | null => {
  switch (route.name) {
    case 'tab':
      return route.tab;
    case 'testList':
      return 'tests';
    case 'testResult':
    case 'leaderboard':
      return 'results';
    default:
      return null;
  }
};

export const showsTabBar = (route: Route): boolean => routeTab(route) !== null;
