// Augments nuxt-auth-utils' session user type with our fields.
declare module '#auth-utils' {
  interface User {
    id: number
  }
}

export {}
