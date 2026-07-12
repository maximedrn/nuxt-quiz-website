<script setup lang="ts">
import is from "@sindresorhus/is";
import { navigateTo } from "nuxt/app";
import { FetchError } from "ofetch";
import { type ComputedRef, computed, type Ref, ref } from "vue";
import { type AuthApi, useAuth } from "@/app/composables/useAuth.ts";
import {
  type TypedI18n,
  useTypedI18n,
} from "@/app/composables/useTypedI18n.ts";
import { TranslationKey } from "@/app/lib/i18n/i18n.keys.ts";

/**
 * A valid login/registration code is exactly 8 digits.
 */
const CODE_PATTERN: RegExp = /^\d{8}$/u;

const i18n: TypedI18n = useTypedI18n();

const auth: AuthApi = useAuth();
const flows: Record<"login" | "register", (code: string) => Promise<void>> = {
  login: auth.login,
  register: auth.register,
};

const code: Ref<string> = ref("");
const error: Ref<string> = ref("");
const pending: Ref<boolean> = ref(false);

const isValid: ComputedRef<boolean> = computed(() =>
  CODE_PATTERN.test(code.value),
);

/**
 * Message extracted from a failed auth request, falling back to a generic one.
 */
const errorFrom: (cause: unknown) => string = (cause: unknown): string => {
  if (
    cause instanceof FetchError &&
    is.plainObject(cause.data) &&
    is.string(cause.data.statusMessage)
  ) {
    return cause.data.statusMessage;
  }
  return i18n.t(TranslationKey.loginInvalidCode);
};

/**
 * Runs a login or register flow and redirects home on success.
 */
const _run: (kind: "login" | "register") => Promise<void> = async (
  kind: "login" | "register",
): Promise<void> => {
  error.value = "";
  if (!isValid.value) {
    error.value = i18n.t(TranslationKey.loginInvalidCode);
    return;
  }
  pending.value = true;
  await flows[kind](code.value)
    .then(async (): Promise<void> => {
      await navigateTo("/");
    })
    .catch((_error: unknown): void => {
      error.value = errorFrom(_error);
    });
  pending.value = false;
};
</script>

<template>
  <div :class="cn('flex', 'min-h-screen', 'flex-col')">
    <AppHeader :compact="true" />
    <main
      :class="
        cn('flex', 'flex-1', 'items-center', 'justify-center', 'px-6', 'py-12')
      "
    >
      <Card :class="cn('w-full', 'max-w-sm')">
        <CardContent :class="cn('flex', 'flex-col', 'gap-5', 'p-8')">
          <div :class="cn('flex', 'flex-col', 'gap-1')">
            <p
              :class="
                cn(
                  'font-mono',
                  'text-xs',
                  'font-medium',
                  'uppercase',
                  'tracking-wider',
                  'text-ink-faint',
                )
              "
            >
              {{ i18n.t(TranslationKey.loginTitle) }}
            </p>
            <h1 :class="cn('text-2xl')">
              {{ i18n.t(TranslationKey.loginSubtitle) }}
            </h1>
          </div>

          <div :class="cn('flex', 'flex-col', 'gap-2')">
            <Label>{{ i18n.t(TranslationKey.loginCodeLabel) }}</Label>
            <Input
              v-model="code"
              type="password"
              inputmode="numeric"
              autocomplete="off"
              maxlength="8"
              :placeholder="i18n.t(TranslationKey.loginCodePlaceholder)"
              :class="
                cn('text-center', 'font-mono', 'text-lg', 'tracking-[0.3em]')
              "
              @keyup.enter="_run('login')"
            />
          </div>

          <p v-if="error" :class="cn('text-sm', 'text-danger')">{{ error }}</p>

          <div :class="cn('flex', 'flex-col', 'gap-2', 'sm:flex-row')">
            <Button
              :class="cn('flex-1')"
              :disabled="pending"
              @click="_run('login')"
            >
              {{ i18n.t(TranslationKey.loginSignIn) }}
            </Button>
            <Button
              variant="outline"
              :class="cn('flex-1')"
              :disabled="pending"
              @click="_run('register')"
            >
              {{ i18n.t(TranslationKey.loginRegister) }}
            </Button>
          </div>

          <p :class="cn('text-xs', 'text-ink-faint')">
            {{ i18n.t(TranslationKey.loginHint) }}
          </p>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
