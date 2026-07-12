const ApiEndpoint = {
  api: "/api",
  auth: "/api/auth",
  authLogin: "/api/auth/login",
  authLogout: "/api/auth/logout",
  authMe: "/api/auth/me",
  authRegister: "/api/auth/register",
  questionsCount: "/api/questions/count",
  quizzes: "/api/quizzes",
  session: "/api/sessions/{id}",
  sessionAnswer: "/api/sessions/{id}/answer",
  sessionFinish: "/api/sessions/{id}/finish",
  sessionResults: "/api/sessions/{id}/results",
  sessions: "/api/sessions",
  stats: "/api/stats",
} as const satisfies Record<string, string>;

type ApiEndpoint = (typeof ApiEndpoint)[keyof typeof ApiEndpoint];

const IdToken: string = "{id}";

export { ApiEndpoint, IdToken };
