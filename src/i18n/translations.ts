import { Language } from '../services/profile.service';

export interface Translations {
  // Bottom Tab Navigation
  tab_home: string;
  tab_tests: string;
  tab_results: string;
  tab_profile: string;

  // Common UI
  loading: string;
  retry: string;
  cancel: string;
  save: string;
  search_placeholder: string;
  view_all: string;
  just_now: string;
  mins_ago: string;
  hours_ago: string;
  days_ago: string;

  // Home Screen
  welcome_back: string;
  hello: string;
  all_categories: string;
  tests_attempted: string;
  avg_score: string;
  overall_rank: string;
  categories: string;
  practice_papers: string;
  quick_mock_test: string;
  questions: string;
  minutes: string;
  marks: string;
  start_test: string;
  resume_test: string;
  reattempt: string;
  attempt_now: string;
  no_tests_available: string;
  recommended_for_you: string;
  target_exam: string;
  top_performers: string;
  continue_practicing: string;
  total_mock_tests: string;
  not_attempted: string;
  in_progress: string;
  completed: string;

  // Tests Screen
  test_series_title: string;
  test_series_subtitle: string;
  select_category: string;
  start_practice: string;
  difficulty: string;
  full_mock_tests: string;

  // Test List Screen
  tests_in_category: string;
  total_tests: string;
  score: string;

  // Test Instructions Screen
  test_instructions: string;
  total_questions: string;
  total_marks: string;
  duration: string;
  negative_marking: string;
  guidelines_title: string;
  guideline_1: string;
  guideline_2: string;
  guideline_3: string;
  guideline_4: string;
  guideline_5: string;
  i_agree_instructions: string;
  start_test_now: string;
  accept_instructions_alert: string;

  // Results Screen
  results_performance: string;
  test_history: string;
  passed: string;
  failed: string;
  view_solutions: string;
  leaderboard: string;
  accuracy: string;
  no_history_yet: string;

  // Profile Screen
  student_profile: string;
  edit_profile: string;
  language_preferences: string;
  help_support: string;
  logout: string;
  performance_summary: string;
  account_info: string;
  name: string;
  email: string;
  mobile: string;
  preferred_language: string;

  // Language Preferences Screen
  language_pref_title: string;
  language_pref_subtitle: string;
  language_saved_alert: string;
  saving_language: string;

  // Notifications Screen
  notifications_title: string;
  mark_all_read: string;
  no_notifications: string;
  action_start_test: string;
  action_view_solutions: string;
  action_view_series: string;

  // Solution Review Screen
  solution_review: string;
  question_label: string;
  your_answer: string;
  correct_answer: string;
  explanation: string;
  next_question: string;
  prev_question: string;
  not_answered: string;

  // Test Result Screen
  test_result_title: string;
  your_score: string;
  passing_score: string;
  correct_answers: string;
  wrong_answers: string;
  skipped: string;
  time_taken: string;
  rank_of: string;
  subject_breakdown: string;
  reattempt_test_btn: string;

  // Help & Support Screen
  help_support_title: string;
  faq_section: string;
  contact_us: string;
  send_query: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  English: {
    tab_home: 'Home',
    tab_tests: 'Tests',
    tab_results: 'Results',
    tab_profile: 'Profile',

    loading: 'Loading...',
    retry: 'Tap to retry',
    cancel: 'Cancel',
    save: 'Save',
    search_placeholder: 'Search tests or categories...',
    view_all: 'View All',
    just_now: 'Just now',
    mins_ago: 'm ago',
    hours_ago: 'h ago',
    days_ago: 'd ago',

    welcome_back: 'Welcome back,',
    hello: 'Hello,',
    all_categories: 'All Categories',
    tests_attempted: 'Tests Attempted',
    avg_score: 'Avg. Score',
    overall_rank: 'Overall Rank',
    categories: 'Categories',
    practice_papers: 'Practice Papers',
    quick_mock_test: 'Quick Mock Test',
    questions: 'Questions',
    minutes: 'Minutes',
    marks: 'Marks',
    start_test: 'Start Test',
    resume_test: 'Resume Test',
    reattempt: 'Reattempt',
    attempt_now: 'Attempt Now',
    no_tests_available: 'No tests available in this category yet.',
    recommended_for_you: 'Recommended For You',
    target_exam: 'Target Exam',
    top_performers: 'Top Performers',
    continue_practicing: 'Continue Practicing',
    total_mock_tests: 'Full Mock Tests',
    not_attempted: 'Not Attempted',
    in_progress: 'In Progress',
    completed: 'Completed',

    test_series_title: 'Test Series',
    test_series_subtitle: 'Explore mock tests by exam category',
    select_category: 'Select a Category',
    start_practice: 'Start Practice',
    difficulty: 'Difficulty',
    full_mock_tests: 'Full Mock Tests',

    tests_in_category: 'Tests',
    total_tests: 'Total Tests',
    score: 'Score',

    test_instructions: 'Test Instructions',
    total_questions: 'Total Questions',
    total_marks: 'Total Marks',
    duration: 'Duration',
    negative_marking: 'Negative Marking',
    guidelines_title: 'General Guidelines',
    guideline_1: 'The exam clock will run automatically once you begin.',
    guideline_2: 'Make sure your internet connection remains uninterrupted.',
    guideline_3: 'Do not close or minimize the app during the exam.',
    guideline_4: 'Each correct answer earns marks; each incorrect answer applies negative marks.',
    guideline_5: 'You can mark any question to review later before submitting the test.',
    i_agree_instructions: 'I have read and agree to all the instructions',
    start_test_now: 'START TEST NOW',
    accept_instructions_alert: 'Please check the box to agree to the test instructions.',

    results_performance: 'Results & Performance',
    test_history: 'Test History',
    passed: 'PASSED',
    failed: 'FAILED',
    view_solutions: 'View Solutions',
    leaderboard: 'Leaderboard',
    accuracy: 'Accuracy',
    no_history_yet: 'No tests completed yet. Start practicing now!',

    student_profile: 'Student Profile',
    edit_profile: 'Edit Profile',
    language_preferences: 'Language Preferences',
    help_support: 'Help & Support',
    logout: 'Log Out',
    performance_summary: 'Performance Summary',
    account_info: 'Account Information',
    name: 'Full Name',
    email: 'Email Address',
    mobile: 'Mobile Number',
    preferred_language: 'Preferred Language',

    language_pref_title: 'Language Preferences',
    language_pref_subtitle: 'Choose the language you would like to use across the app.',
    language_saved_alert: 'Language preference saved successfully!',
    saving_language: 'Updating language...',

    notifications_title: 'Notifications',
    mark_all_read: 'Mark all',
    no_notifications: 'No notifications yet.',
    action_start_test: 'Start Test Now ›',
    action_view_solutions: 'View Solution & Answer Key ›',
    action_view_series: 'View Series ›',

    solution_review: 'Solution Review',
    question_label: 'Question',
    your_answer: 'Your Answer',
    correct_answer: 'Correct Answer',
    explanation: 'Explanation',
    next_question: 'Next Question',
    prev_question: 'Previous Question',
    not_answered: 'Not Answered',

    test_result_title: 'Test Result',
    your_score: 'Your Score',
    passing_score: 'Passing Marks',
    correct_answers: 'Correct',
    wrong_answers: 'Incorrect',
    skipped: 'Skipped',
    time_taken: 'Time Taken',
    rank_of: 'Rank',
    subject_breakdown: 'Subject Breakdown',
    reattempt_test_btn: 'Reattempt Test',

    help_support_title: 'Help & Support',
    faq_section: 'Frequently Asked Questions',
    contact_us: 'Contact Support',
    send_query: 'Send Query',
  },

  Hindi: {
    tab_home: 'होम',
    tab_tests: 'टेस्ट',
    tab_results: 'परिणाम',
    tab_profile: 'प्रोफ़ाइल',

    loading: 'लोड हो रहा है...',
    retry: 'पुनः प्रयास करें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    search_placeholder: 'टेस्ट या श्रेणी खोजें...',
    view_all: 'सभी देखें',
    just_now: 'अभी-अभी',
    mins_ago: 'मिनट पहले',
    hours_ago: 'घंटे पहले',
    days_ago: 'दिन पहले',

    welcome_back: 'वापसी पर स्वागत है,',
    hello: 'नमस्ते,',
    all_categories: 'सभी श्रेणियां',
    tests_attempted: 'कुल टेस्ट दिए',
    avg_score: 'औसत अंक',
    overall_rank: 'समग्र रैंक',
    categories: 'श्रेणियां',
    practice_papers: 'अभ्यास पत्र',
    quick_mock_test: 'त्वरित मॉक टेस्ट',
    questions: 'प्रश्न',
    minutes: 'मिनट',
    marks: 'अंक',
    start_test: 'टेस्ट शुरू करें',
    resume_test: 'टेस्ट जारी रखें',
    reattempt: 'फिर से दें',
    attempt_now: 'अभी प्रयास करें',
    no_tests_available: 'इस श्रेणी में अभी कोई टेस्ट उपलब्ध नहीं है।',
    recommended_for_you: 'आपके लिए अनुशंसित',
    target_exam: 'लक्षित परीक्षा',
    top_performers: 'शीर्ष छात्र',
    continue_practicing: 'अभ्यास जारी रखें',
    total_mock_tests: 'पूर्ण मॉक टेस्ट',
    not_attempted: 'प्रयास नहीं किया',
    in_progress: 'प्रगति पर है',
    completed: 'पूर्ण हुआ',

    test_series_title: 'टेस्ट सीरीज़',
    test_series_subtitle: 'परीक्षा श्रेणी अनुसार मॉक टेस्ट देखें',
    select_category: 'एक श्रेणी चुनें',
    start_practice: 'अभ्यास शुरू करें',
    difficulty: 'कठिनाई स्तर',
    full_mock_tests: 'पूर्ण मॉक टेस्ट',

    tests_in_category: 'टेस्ट सूची',
    total_tests: 'कुल टेस्ट',
    score: 'प्राप्तांक',

    test_instructions: 'टेस्ट निर्देश',
    total_questions: 'कुल प्रश्न',
    total_marks: 'कुल अंक',
    duration: 'समय सीमा',
    negative_marking: 'नकारात्मक अंकन',
    guidelines_title: 'सामान्य दिशा-निर्देश',
    guideline_1: 'टेस्ट शुरू होते ही परीक्षा की घड़ी अपने आप चलने लगेगी।',
    guideline_2: 'सुनिश्चित करें कि आपका इंटरनेट कनेक्शन स्थिर रहे।',
    guideline_3: 'परीक्षा के दौरान ऐप को बंद या छोटा न करें।',
    guideline_4: 'प्रत्येक सही उत्तर पर अंक मिलेंगे; गलत उत्तर पर नकारात्मक अंक कटेंगे।',
    guideline_5: 'जमा करने से पहले समीक्षा के लिए आप प्रश्नों को मार्क कर सकते हैं।',
    i_agree_instructions: 'मैंने सभी निर्देश पढ़ लिए हैं और मैं सहमत हूँ',
    start_test_now: 'अभी टेस्ट शुरू करें',
    accept_instructions_alert: 'कृपया आगे बढ़ने के लिए निर्देशों को स्वीकार करें।',

    results_performance: 'परिणाम और प्रदर्शन',
    test_history: 'टेस्ट इतिहास',
    passed: 'उत्तीर्ण',
    failed: 'अनुत्तीर्ण',
    view_solutions: 'हल एवं उत्तर देखें',
    leaderboard: 'लीडरबोर्ड',
    accuracy: 'सटीकता',
    no_history_yet: 'अभी तक कोई टेस्ट पूरा नहीं हुआ है। अभी अभ्यास शुरू करें!',

    student_profile: 'छात्र प्रोफ़ाइल',
    edit_profile: 'प्रोफ़ाइल बदलें',
    language_preferences: 'भाषा प्राथमिकताएं',
    help_support: 'सहायता एवं समर्थन',
    logout: 'लॉग आउट',
    performance_summary: 'प्रदर्शन सारांश',
    account_info: 'खाता विवरण',
    name: 'पूरा नाम',
    email: 'ईमेल पता',
    mobile: 'मोबाइल नंबर',
    preferred_language: 'पसंदीदा भाषा',

    language_pref_title: 'भाषा प्राथमिकताएं',
    language_pref_subtitle: 'वह भाषा चुनें जिसका आप ऐप में उपयोग करना चाहते हैं।',
    language_saved_alert: 'भाषा प्राथमिकता सफलतापूर्वक सहेजी गई!',
    saving_language: 'भाषा अपडेट हो रही है...',

    notifications_title: 'सूचनाएं',
    mark_all_read: 'सभी पढ़ा हुआ मार्क करें',
    no_notifications: 'अभी कोई नई सूचना नहीं है।',
    action_start_test: 'अभी टेस्ट शुरू करें ›',
    action_view_solutions: 'उत्तर कुंजी एवं हल देखें ›',
    action_view_series: 'सीरीज़ देखें ›',

    solution_review: 'हल एवं उत्तर समीक्षा',
    question_label: 'प्रश्न',
    your_answer: 'आपका उत्तर',
    correct_answer: 'सही उत्तर',
    explanation: 'विस्तृत व्याख्या',
    next_question: 'अगला प्रश्न',
    prev_question: 'पिछला प्रश्न',
    not_answered: 'उत्तर नहीं दिया',

    test_result_title: 'टेस्ट परिणाम',
    your_score: 'आपका स्कोर',
    passing_score: 'उत्तीर्ण अंक',
    correct_answers: 'सही उत्तर',
    wrong_answers: 'गलत उत्तर',
    skipped: 'छोड़े गए',
    time_taken: 'लिया गया समय',
    rank_of: 'रैंक',
    subject_breakdown: 'विषयवार विवरण',
    reattempt_test_btn: 'फिर से टेस्ट दें',

    help_support_title: 'सहायता एवं समर्थन',
    faq_section: 'अक्सर पूछे जाने वाले प्रश्न',
    contact_us: 'सहायता से संपर्क करें',
    send_query: 'प्रश्न भेजें',
  },

  Tamil: {
    tab_home: 'முகப்பு',
    tab_tests: 'தேர்வுகள்',
    tab_results: 'முடிவுகள்',
    tab_profile: 'சுயவிவரம்',

    loading: 'ஏற்றுகிறது...',
    retry: 'மீண்டும் முயற்சிக்கவும்',
    cancel: 'ரத்து செய்',
    save: 'சேமி',
    search_placeholder: 'தேர்வுகள் அல்லது பிரிவுகளைத் தேடுங்கள்...',
    view_all: 'அனைத்தையும் காண்க',
    just_now: 'இப்போதுதான்',
    mins_ago: 'நிமிடங்களுக்கு முன்',
    hours_ago: 'மணிநேரங்களுக்கு முன்',
    days_ago: 'நாட்களுக்கு முன்',

    welcome_back: 'மீண்டும் வருக,',
    hello: 'வணக்கம்,',
    all_categories: 'அனைத்து பிரிவுகள்',
    tests_attempted: 'எழுதிய தேர்வுகள்',
    avg_score: 'சராசரி மதிப்பெண்',
    overall_rank: 'ஒட்டுமொத்த தரம்',
    categories: 'பிரிவுகள்',
    practice_papers: 'பயிற்சி தாள்கள்',
    quick_mock_test: 'மாதிரி தேர்வு',
    questions: 'கேள்விகள்',
    minutes: 'நிமிடங்கள்',
    marks: 'மதிப்பெண்கள்',
    start_test: 'தேர்வை தொடங்குக',
    resume_test: 'தேர்வை தொடர்க',
    reattempt: 'மீண்டும் எழுதுக',
    attempt_now: 'இப்போது எழுதுக',
    no_tests_available: 'இப்பிரிவில் தேர்வுகள் எதுவும் கிடைக்கவில்லை.',
    recommended_for_you: 'உங்களுக்காக பரிந்துரைக்கப்படுகிறது',
    target_exam: 'இலக்கு தேர்வு',
    top_performers: 'சிறந்த மாணவர்கள்',
    continue_practicing: 'பயிற்சியைத் தொடரவும்',
    total_mock_tests: 'முழு மாதிரி தேர்வுகள்',
    not_attempted: 'முயற்சிக்கவில்லை',
    in_progress: 'நடைபெறுகிறது',
    completed: 'முடிந்தது',

    test_series_title: 'தேர்வுத் தொடர்',
    test_series_subtitle: 'பிரிவு வாரியாக மாதிரித் தேர்வுகளை ஆராயுங்கள்',
    select_category: 'ஒரு பிரிவைத் தேர்ந்தெடுக்கவும்',
    start_practice: 'பயிற்சியைத் தொடங்குங்கள்',
    difficulty: 'கடினத்தன்மை',
    full_mock_tests: 'முழு மாதிரி தேர்வுகள்',

    tests_in_category: 'தேர்வுகள்',
    total_tests: 'மொத்த தேர்வுகள்',
    score: 'மதிப்பெண்',

    test_instructions: 'தேர்வு வழிமுறைகள்',
    total_questions: 'மொத்த கேள்விகள்',
    total_marks: 'மொத்த மதிப்பெண்கள்',
    duration: 'கால அளவு',
    negative_marking: 'எதிர்மறை மதிப்பெண்',
    guidelines_title: 'பொதுவான வழிகாட்டுதல்கள்',
    guideline_1: 'நீங்கள் தொடங்கியவுடன் தேர்வு கடிகாரம் இயங்கும்.',
    guideline_2: 'இணைய இணைப்பு சீராக இருப்பதை உறுதிப்படுத்தவும்.',
    guideline_3: 'தேர்வின் போது செயலியை மூட வேண்டாம்.',
    guideline_4: 'சரியான பதிலுக்கு மதிப்பெண்கள்; தவறான பதிலுக்கு எதிர்மறை மதிப்பெண்.',
    guideline_5: 'சமர்ப்பிக்கும் முன் கேள்விகளை மறுபரிசீலனைக்கு குறிக்கலாம்.',
    i_agree_instructions: 'அனைத்து வழிமுறைகளையும் படித்து ஒப்புக்கொள்கிறேன்',
    start_test_now: 'இப்போது தொடங்குங்கள்',
    accept_instructions_alert: 'தொடர வழிமுறைகளை ஏற்கவும்.',

    results_performance: 'முடிவுகள் மற்றும் செயல்திறன்',
    test_history: 'தேர்வு வரலாறு',
    passed: 'வெற்றி',
    failed: 'தோல்வி',
    view_solutions: 'விடைகளை காண்க',
    leaderboard: 'முன்னிலை பட்டியல்',
    accuracy: 'துல்லியம்',
    no_history_yet: 'இன்னும் எந்த தேர்வும் முடிக்கப்படவில்லை.',

    student_profile: 'மாணவர் சுயவிவரம்',
    edit_profile: 'சுயவிவரத்தை திருத்து',
    language_preferences: 'மொழி விருப்பங்கள்',
    help_support: 'உதவி மற்றும் ஆதரவு',
    logout: 'வெளியேறு',
    performance_summary: 'செயல்திறன் சுருக்கம்',
    account_info: 'கணக்கு தகவல்',
    name: 'முழு பெயர்',
    email: 'மின்னஞ்சல்',
    mobile: 'மொபைல் எண்',
    preferred_language: 'விருப்பமான மொழி',

    language_pref_title: 'மொழி விருப்பங்கள்',
    language_pref_subtitle: 'பயன்பாட்டில் நீங்கள் பயன்படுத்த விரும்பும் மொழியைத் தேர்வுசெய்யவும்.',
    language_saved_alert: 'மொழி விருப்பம் வெற்றிகரமாக சேமிக்கப்பட்டது!',
    saving_language: 'மொழி புதுப்பிக்கப்படுகிறது...',

    notifications_title: 'அறிவிப்புகள்',
    mark_all_read: 'அனைத்தும் படித்ததாக குறிக்கவும்',
    no_notifications: 'அறிவிப்புகள் எதுவும் இல்லை.',
    action_start_test: 'தேர்வை தொடங்குங்கள் ›',
    action_view_solutions: 'விடை மற்றும் விளக்கத்தைக் காண்க ›',
    action_view_series: 'தொடரைக் காண்க ›',

    solution_review: 'விடை விளக்கம்',
    question_label: 'கேள்வி',
    your_answer: 'உங்கள் பதில்',
    correct_answer: 'சரியான பதில்',
    explanation: 'விளக்கம்',
    next_question: 'அடுத்த கேள்வி',
    prev_question: 'முந்தைய கேள்வி',
    not_answered: 'பதிலளிக்கவில்லை',

    test_result_title: 'தேர்வு முடிவு',
    your_score: 'உங்கள் மதிப்பெண்',
    passing_score: 'தேர்ச்சி மதிப்பெண்',
    correct_answers: 'சரி',
    wrong_answers: 'தவறு',
    skipped: 'தவிர்க்கப்பட்டது',
    time_taken: 'எடுத்துக்கொண்ட நேரம்',
    rank_of: 'தரம்',
    subject_breakdown: 'பாடவாரி விவரம்',
    reattempt_test_btn: 'மீண்டும் தேர்வு எழுதுங்கள்',

    help_support_title: 'உதவி மற்றும் ஆதரவு',
    faq_section: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    contact_us: 'ஆதரவைத் தொடர்பு கொள்ளவும்',
    send_query: 'கேள்வியை அனுப்புங்கள்',
  },

  Telugu: {
    tab_home: 'హోమ్',
    tab_tests: 'పరీక్షలు',
    tab_results: 'ఫలితాలు',
    tab_profile: 'ప్రొఫైల్',

    loading: 'లోడ్ అవుతోంది...',
    retry: 'మళ్ళీ ప్రయత్నించండి',
    cancel: 'రద్దు చేయి',
    save: 'సేవ్ చేయి',
    search_placeholder: 'పరీక్షలు లేదా వర్గాలను శోధించండి...',
    view_all: 'అన్నీ చూడండి',
    just_now: 'ఇప్పుడే',
    mins_ago: 'నిమిషాల క్రితం',
    hours_ago: 'గంటల క్రితం',
    days_ago: 'రోజుల క్రితం',

    welcome_back: 'స్వాగతం,',
    hello: 'నమస్కారం,',
    all_categories: 'అన్ని వర్గాలు',
    tests_attempted: 'రాసిన పరీక్షలు',
    avg_score: 'సగటు స్కోరు',
    overall_rank: 'మొత్తం ర్యాంక్',
    categories: 'వర్గాలు',
    practice_papers: 'ప్రాక్టీస్ పేపర్లు',
    quick_mock_test: 'మాక్ టెస్ట్',
    questions: 'ప్రశ్నలు',
    minutes: 'నిమిషాలు',
    marks: 'మార్కులు',
    start_test: 'పరీక్ష ప్రారంభించండి',
    resume_test: 'పరీక్ష కొనసాగించండి',
    reattempt: 'మళ్ళీ రాయండి',
    attempt_now: 'ఇప్పుడే ప్రయత్నించండి',
    no_tests_available: 'ఈ వర్గంలో పరీక్షలు అందుబాటులో లేవు.',
    recommended_for_you: 'మీ కోసం సిఫార్సు చేయబడినవి',
    target_exam: 'లక్ష్య పరీక్ష',
    top_performers: 'ఉత్తమ ప్రతిభావంతులు',
    continue_practicing: 'సాధన కొనసాగించండి',
    total_mock_tests: 'పూర్తి మాక్ పరీక్షలు',
    not_attempted: 'ప్రయత్నించలేదు',
    in_progress: 'పురోగతిలో ఉంది',
    completed: 'పూర్తయింది',

    test_series_title: 'పరీక్షా శ్రేణి',
    test_series_subtitle: 'పరీక్షా వర్గం ప్రకారం మాక్ పరీక్షలను అన్వేషించండి',
    select_category: 'ఒక వర్గాన్ని ఎంచుకోండి',
    start_practice: 'సాధన ప్రారంభించండి',
    difficulty: 'కఠినత స్థాయి',
    full_mock_tests: 'పూర్తి మాక్ పరీక్షలు',

    tests_in_category: 'పరీక్షలు',
    total_tests: 'మొత్తం పరీక్షలు',
    score: 'స్కోరు',

    test_instructions: 'పరీక్ష సూచనలు',
    total_questions: 'మొత్తం ప్రశ్నలు',
    total_marks: 'మొత్తం మార్కులు',
    duration: 'సమయం',
    negative_marking: 'నెగటివ్ మార్కింగ్',
    guidelines_title: 'సాధారణ మార్గదర్శకాలు',
    guideline_1: 'మీరు ప్రారంభించిన వెంటనే పరీక్ష గడియారం నడుస్తుంది.',
    guideline_2: 'మీ ఇంటర్నెట్ కనెక్షన్ స్థిరంగా ఉందని నిర్ధారించుకోండి.',
    guideline_3: 'పరీక్ష సమయంలో యాప్‌ను మూసివేయవద్దు.',
    guideline_4: 'సరైన సమాధానానికి మార్కులు; తప్పు సమాధానానికి నెగటివ్ మార్కులు.',
    guideline_5: 'సమర్పించే ముందు సమీక్ష కోసం ప్రశ్నలను గుర్తించవచ్చు.',
    i_agree_instructions: 'నేను అన్ని సూచనలను చదివాను మరియు అంగీకరిస్తున్నాను',
    start_test_now: 'ఇప్పుడే ప్రారంభించండి',
    accept_instructions_alert: 'కొనసాగడానికి సూచనలను అంగీకరించండి.',

    results_performance: 'ఫలితాలు మరియు పనితీరు',
    test_history: 'పరీక్ష చరిత్ర',
    passed: 'ఉత్తీర్ణత',
    failed: 'ఫెయిల్',
    view_solutions: 'సమాధానాలు చూడండి',
    leaderboard: 'లీడర్‌బోర్డ్',
    accuracy: 'ఖచ్చితత్వం',
    no_history_yet: 'ఇంకా పరీక్షలు పూర్తి కాలేదు.',

    student_profile: 'విద్యార్థి ప్రొఫైల్',
    edit_profile: 'ప్రొఫైల్ సవరించండి',
    language_preferences: 'భాష ప్రాధాన్యతలు',
    help_support: 'సహాయం మరియు మద్దతు',
    logout: 'లాగ్ అవుట్',
    performance_summary: 'పనితీరు సారాంశం',
    account_info: 'ఖాతా సమాచారం',
    name: 'పూర్తి పేరు',
    email: 'ఇమెయిల్',
    mobile: 'మొబైల్ నంబర్',
    preferred_language: 'ప్రాధాన్య భాష',

    language_pref_title: 'భాష ప్రాధాన్యతలు',
    language_pref_subtitle: 'యాప్‌లో మీరు ఉపయోగించాలనుకుంటున్న భాషను ఎంచుకోండి.',
    language_saved_alert: 'భాషా ప్రాధాన్యత విజయవంతంగా సేవ్ చేయబడింది!',
    saving_language: 'భాష అప్‌డేట్ అవుతోంది...',

    notifications_title: 'నోటిఫికేషన్‌లు',
    mark_all_read: 'అన్నీ చదివినట్లు గుర్తు పెట్టు',
    no_notifications: 'నోటిఫికేషన్‌లు ఏవీ లేవు.',
    action_start_test: 'ఇప్పుడే పరీక్ష ప్రారంభించండి ›',
    action_view_solutions: 'సమాధానాలు మరియు వివరణ చూడండి ›',
    action_view_series: 'శ్రేణిని చూడండి ›',

    solution_review: 'సమాధాన వివరణ',
    question_label: 'ప్రశ్న',
    your_answer: 'మీ సమాధానం',
    correct_answer: 'సరైన సమాధానం',
    explanation: 'వివరణ',
    next_question: 'తరువాతి ప్రశ్న',
    prev_question: 'మునుపటి ప్రశ్న',
    not_answered: 'సమాధానం ఇవ్వలేదు',

    test_result_title: 'పరీక్ష ఫలితం',
    your_score: 'మీ స్కోరు',
    passing_score: 'ఉత్తీర్ణత మార్కులు',
    correct_answers: 'సరైనవి',
    wrong_answers: 'తప్పులు',
    skipped: 'వదిలివేసినవి',
    time_taken: 'తీసుకున్న సమయం',
    rank_of: 'ర్యాంక్',
    subject_breakdown: 'సబ్జెక్ట్ వారీ వివరాలు',
    reattempt_test_btn: 'మళ్ళీ పరీక్ష రాయండి',

    help_support_title: 'సహాయం మరియు మద్దతు',
    faq_section: 'తరచుగా అడిగే ప్రశ్నలు',
    contact_us: 'సహాయాన్ని సంప్రదించండి',
    send_query: 'ప్రశ్న పంపండి',
  },

  Bengali: {
    tab_home: 'হোম',
    tab_tests: 'পরীক্ষা',
    tab_results: 'ফলাফল',
    tab_profile: 'প্রোফাইল',

    loading: 'লোড হচ্ছে...',
    retry: 'আবার চেষ্টা করুন',
    cancel: 'বাতিল',
    save: 'সংরক্ষণ',
    search_placeholder: 'পরীক্ষা বা বিভাগ অনুসন্ধান করুন...',
    view_all: 'সব দেখুন',
    just_now: 'এইমাত্র',
    mins_ago: 'মিনিট আগে',
    hours_ago: 'ঘণ্টা আগে',
    days_ago: 'দিন আগে',

    welcome_back: 'স্বাগতম,',
    hello: 'নমস্কার,',
    all_categories: 'সকল বিভাগ',
    tests_attempted: 'মোট পরীক্ষা',
    avg_score: 'গড় স্কোর',
    overall_rank: 'সামগ্রিক র‍্যাঙ্ক',
    categories: 'বিভাগসমূহ',
    practice_papers: 'অনুশীলন পত্র',
    quick_mock_test: 'মক টেস্ট',
    questions: 'প্রশ্ন',
    minutes: 'মিনিট',
    marks: 'নম্বর',
    start_test: 'পরীক্ষা শুরু করুন',
    resume_test: 'পরীক্ষা চালিয়ে যান',
    reattempt: 'আবার দিন',
    attempt_now: 'এখনই চেষ্টা করুন',
    no_tests_available: 'এই বিভাগে এখনও কোনো পরীক্ষা নেই।',
    recommended_for_you: 'আপনার জন্য প্রস্তাবিত',
    target_exam: 'লক্ষ্য পরীক্ষা',
    top_performers: 'সেরা শিক্ষার্থী',
    continue_practicing: 'অনুশীলন চালিয়ে যান',
    total_mock_tests: 'সম্পূর্ণ মক টেস্ট',
    not_attempted: 'দেওয়া হয়নি',
    in_progress: 'চলছে',
    completed: 'সম্পন্ন',

    test_series_title: 'টেস্ট সিরিজ',
    test_series_subtitle: 'বিভাগ অনুযায়ী মক পরীক্ষাগুলি অন্বেষণ করুন',
    select_category: 'একটি বিভাগ নির্বাচন করুন',
    start_practice: 'অনুশীলন শুরু করুন',
    difficulty: 'কঠিনতার স্তর',
    full_mock_tests: 'সম্পূর্ণ মক টেস্ট',

    tests_in_category: 'পরীক্ষাসমূহ',
    total_tests: 'মোট পরীক্ষা',
    score: 'প্রাপ্ত নম্বর',

    test_instructions: 'পরীক্ষার নির্দেশাবলী',
    total_questions: 'মোট প্রশ্ন',
    total_marks: 'মোট নম্বর',
    duration: 'সময়সীমা',
    negative_marking: 'নেগেটিভ মার্কিং',
    guidelines_title: 'সাধারণ নির্দেশিকা',
    guideline_1: 'পরীক্ষা শুরু হলেই টাইমার স্বয়ংক্রিয়ভাবে চলবে।',
    guideline_2: 'ইন্টারনেট সংযোগ স্থিতিশীল রাখুন।',
    guideline_3: 'পরীক্ষার সময় অ্যাপ বন্ধ করবেন না।',
    guideline_4: 'সঠিক উত্তরের জন্য নম্বর; ভুল উত্তরের জন্য নেগেটিভ মার্কিং।',
    guideline_5: 'জমা দেওয়ার আগে প্রশ্নগুলি পর্যালোচনার জন্য চিহ্নিত করতে পারেন।',
    i_agree_instructions: 'আমি সমস্ত নির্দেশাবলী পড়েছি এবং সম্মত',
    start_test_now: 'এখনই শুরু করুন',
    accept_instructions_alert: 'এগিয়ে যেতে নির্দেশাবলী স্বীকার করুন।',

    results_performance: 'ফলাফল এবং পারফরম্যান্স',
    test_history: 'পরীক্ষার ইতিহাস',
    passed: 'উত্তীর্ণ',
    failed: 'অনুত্তীর্ণ',
    view_solutions: 'উত্তর ও সমাধান দেখুন',
    leaderboard: 'লিডারবোর্ড',
    accuracy: 'নির্ভুলতা',
    no_history_yet: 'এখনও কোনো পরীক্ষা সম্পন্ন হয়নি।',

    student_profile: 'শিক্ষার্থীর প্রোফাইল',
    edit_profile: 'প্রোফাইল পরিবর্তন',
    language_preferences: 'ভাষা পছন্দ',
    help_support: 'সাহায্য ও সহায়তা',
    logout: 'লগ আউট',
    performance_summary: 'পারফরম্যান্স সারাংশ',
    account_info: 'অ্যাকাউন্ট বিবরণ',
    name: 'সম্পূর্ণ নাম',
    email: 'ইমেল ঠিকানা',
    mobile: 'মোবাইল নম্বর',
    preferred_language: 'পছন্দের ভাষা',

    language_pref_title: 'ভাষা পছন্দ',
    language_pref_subtitle: 'অ্যাপটিতে আপনি যে ভাষাটি ব্যবহার করতে চান তা নির্বাচন করুন।',
    language_saved_alert: 'ভাষা পছন্দ সফলভাবে সংরক্ষিত হয়েছে!',
    saving_language: 'ভাষা আপডেট করা হচ্ছে...',

    notifications_title: 'বিজ্ঞপ্তি',
    mark_all_read: 'সব পঠিত হিসেবে চিহ্নিত করুন',
    no_notifications: 'কোনো নতুন বিজ্ঞপ্তি নেই।',
    action_start_test: 'এখনই পরীক্ষা শুরু করুন ›',
    action_view_solutions: 'উত্তর ও সমাধান দেখুন ›',
    action_view_series: 'সিরিজ দেখুন ›',

    solution_review: 'সমাধান পর্যালোচনা',
    question_label: 'প্রশ্ন',
    your_answer: 'আপনার উত্তর',
    correct_answer: 'সঠিক উত্তর',
    explanation: 'ব্যাখ্যা',
    next_question: 'পরবর্তী প্রশ্ন',
    prev_question: 'পূর্ববর্তী প্রশ্ন',
    not_answered: 'উত্তর দেওয়া হয়নি',

    test_result_title: 'পরীক্ষার ফলাফল',
    your_score: 'আপনার স্কোর',
    passing_score: 'পাস মার্ক',
    correct_answers: 'সঠিক উত্তর',
    wrong_answers: 'ভুল উত্তর',
    skipped: 'ছেড়ে দেওয়া',
    time_taken: 'সময় লেগেছে',
    rank_of: 'র‍্যাঙ্ক',
    subject_breakdown: 'বিষয়ভিত্তিক বিশ্লেষণ',
    reattempt_test_btn: 'আবার পরীক্ষা দিন',

    help_support_title: 'সাহায্য ও সহায়তা',
    faq_section: 'সাধারণ প্রশ্নাবলী',
    contact_us: 'সহায়তার সাথে যোগাযোগ করুন',
    send_query: 'প্রশ্ন পাঠান',
  },
};
