/**
 * Translation keys as a `const` object — the single source of truth for every
 * translatable string id. Using an object keeps call sites type-safe
 * (`t(TranslationKey.navHistory)`) while the values stay as stable dotted ids.
 */
const TranslationKey = {
  commonDashboard: "common.dashboard",

  commonLoading: "common.loading",
  dashboardAnswers: "dashboard.answers",
  dashboardAverageScore: "dashboard.averageScore",
  dashboardBestScore: "dashboard.bestScore",
  dashboardCompletedSessions: "dashboard.completedSessions",
  dashboardCurrentStreak: "dashboard.currentStreak",
  dashboardDescription: "dashboard.description",
  dashboardEmptyBody: "dashboard.emptyBody",
  dashboardEmptyTitle: "dashboard.emptyTitle",
  dashboardErrorRate: "dashboard.errorRate",

  dashboardEyebrow: "dashboard.eyebrow",
  dashboardOverallAccuracy: "dashboard.overallAccuracy",
  dashboardRecentSessions: "dashboard.recentSessions",
  dashboardStreakActive: "dashboard.streakActive",
  dashboardStreakInactive: "dashboard.streakInactive",
  dashboardStreakValue: "dashboard.streakValue",
  dashboardTitle: "dashboard.title",
  dashboardTrendLabel: "dashboard.trendLabel",
  dashboardViewHistory: "dashboard.viewHistory",
  dashboardWeakest: "dashboard.weakest",
  historyAnswered: "history.answered",

  historyEmpty: "history.empty",
  historyQuestions: "history.questions",
  historyResume: "history.resume",
  historyReview: "history.review",
  historyStartFirst: "history.startFirst",
  loginCodeLabel: "login.codeLabel",
  loginCodePlaceholder: "login.codePlaceholder",
  loginHint: "login.hint",
  loginInvalidCode: "login.invalidCode",
  loginRegister: "login.register",
  loginSignIn: "login.signIn",
  loginSubtitle: "login.subtitle",

  loginTitle: "login.title",

  metaDescription: "meta.description",
  metaTitle: "meta.title",
  modeRandom: "mode.random",
  modeSequential: "mode.sequential",
  navBrand: "nav.brand",
  navHistory: "nav.history",
  navLogout: "nav.logout",
  navNewSession: "nav.newSession",

  questionCorrect: "question.correct",
  questionIncorrect: "question.incorrect",
  quizListEmpty: "quizList.empty",
  quizListStart: "quizList.start",
  quizListTitle: "quizList.title",
  quizNewAll: "quizNew.all",
  quizNewError: "quizNew.error",
  quizNewOrder: "quizNew.order",
  quizNewQuestionCount: "quizNew.questionCount",
  quizNewStart: "quizNew.start",
  quizNewStarting: "quizNew.starting",

  quizNewSubtitle: "quizNew.subtitle",
  quizPlayErrorFinish: "quizPlay.errorFinish",
  quizPlayErrorLoad: "quizPlay.errorLoad",
  quizPlayErrorSubmit: "quizPlay.errorSubmit",
  quizPlayFinish: "quizPlay.finish",
  quizPlayNextQuestion: "quizPlay.nextQuestion",

  quizPlayQuit: "quizPlay.quit",
  resultsCorrect: "results.correct",
  resultsIncorrect: "results.incorrect",

  resultsSessionComplete: "results.sessionComplete",
  themeToggle: "theme.toggle",
} as const satisfies Record<string, string>;

type TranslationKey = (typeof TranslationKey)[keyof typeof TranslationKey];

export { TranslationKey };
