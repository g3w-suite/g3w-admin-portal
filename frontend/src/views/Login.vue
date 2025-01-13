<template>
  <article class="grid">
    
    <div>
      <h2>{{settings.login_title || $tc("login.title")}}</h2>

      <form @keyup.enter="login">

        <!-- USERNAME FIELD -->
        <label for="username">{{$t('login.username')}}</label>
        <input
          :placeholder="$tc('login.username')"
          autocomplete="username"
          id="username"
          required
          type="text"
          v-model="username"
        />
        <p class="error_or_missing" v-if="usernameError">{{$t('login.requiredField')}}</p>

        <!-- PASSWORD FIELD -->
        <label for="password">{{$t('login.password')}}</label>
        <input
          :placeholder="$tc('login.password')"
          autocomplete="current-password"
          id="password"
          required
          type="password"
          v-model="password"
        />
        <p class="error_or_missing" v-if="passwordError">{{$t('login.requiredField')}}</p>

        <!-- SUBMIT BUTTON -->
        <button
          @click="login"
          id="button"
          type="button"
          class="contrast">{{$t('login.submit')}}
        </button>

        <!-- DJANGO-ALLAUTH: since g3w-admin@3.9 (see: https://g3w-suite.readthedocs.io/en/v3.9.x/social_authentication.html) -->
        <template v-for="(url, provider) in settings.social_auth_providers">
          <a :href="(url as string)" role="button" class="contrast outline" style="display: block; margin-bottom: var(--spacing);">
            <svg v-if="'google' === provider" viewBox="0 0 48 48" style="width: 24px; vertical-align: sub;">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85A23.09 23.09 0 0 0 24 0 23.99 23.99 0 0 0 2.56 13.22l7.98 6.19A14.33 14.33 0 0 1 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94a11.16 11.16 0 0 1-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59a14.3 14.3 0 0 1 0-9.18l-7.98-6.19a23.91 23.91 0 0 0 .01 21.56l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6a14.44 14.44 0 0 1-8.16 2.3c-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19A24 24 0 0 0 24 48z"/>
            </svg>
            <svg v-else-if="'microsoft' === provider" width="21" height="21" style="vertical-align: sub;">
              <path fill="#f25022" d="M1 1h9v9H1z"/>
              <path fill="#00a4ef" d="M1 11h9v9H1z"/>
              <path fill="#7fba00" d="M11 1h9v9h-9z"/>
              <path fill="#ffb900" d="M11 11h9v9h-9z"/>
            </svg>
            <svg v-else viewBox="0 0 512 512" width="21">
              <path d="M336 352a176 176 0 1 0-168-122L7 391c-4 5-7 11-7 17v80c0 13 11 24 24 24h80c13 0 24-11 24-24v-40h40c13 0 24-11 24-24v-40h40c6 0 13-2 17-7l33-33c17 5 35 8 54 8zm40-256a40 40 0 1 1 0 80 40 40 0 1 1 0-80z"/>
            </svg>
            &nbsp;<b style="text-transform: capitalize;" >{{ provider }}</b>
          </a>
        </template>

        <p class="error_or_missing" v-if="loginError">{{$t('login.erroreLogin')}}</p>

        <!-- RESET PASSWORD LINK -->
        <div v-if="settings.reset_password_url" >
          <a :href="settings.reset_password_url">{{$t('login.reset_password_url')}}</a>
        </div>

      </form>

    </div>

    <div v-if="settings.login_description">
      <div v-html="settings.login_description"></div>
    </div>
  </article>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-facing-decorator';

import { Info } from '@/types/TInfo';
import { useAuthStore, useDataStore } from '@/stores';
import { get_admin_url } from '@/utils';

@Component({
  name: 'Login',
})
export default class Login extends Vue {

  public username: string = '';
  public password: string = '';

  public passwordError: boolean = false;
  public usernameError: boolean = false;
  public loginError: boolean = false;
  private error_message: string = '';

  get settings(): Info {
    return useDataStore().info;
  }

  public login() {
    if (!this.username) {
      this.usernameError = true;
    }

    if (!this.password) {
      this.passwordError = true;
    }

    if (this.username && this.password) {
      this.usernameError = false;
      this.passwordError = false;
      this.loginError = false;
      useAuthStore()
        .login(this.username, this.password)
        // .then(() => useAuthStore().fetchWhoAmI())
        .then(() => {
          if (useAuthStore().useCookies) {
            this.$router.push({ name: 'home' })
          }
        })
        .catch((e: string) => {
          this.error_message = e;
          this.loginError = true;
        });
    }
  }

  get drf_token(): string {
    return useAuthStore().user?.drf_token || '';
  }

  @Watch('drf_token', {
    immediate: true,
  })
  public onDrfTokenChange(drf_token: string) {
    if (drf_token) {
      location.href = get_admin_url(`/${this.$i18n.locale}/portal/api/whoami/?__drftk=${drf_token}&redirect=` + location.origin);
    }
  }

}
</script>

<style lang="css" scoped>
  article {
    padding: 0;
  }

  article > div:nth-of-type(2) {
    display: flex;
    align-items: center;
    justify-content: center;
    /*color: #fff;*/
    position: relative;
  }

  article > div:nth-of-type(2):before {
    content: '';
    position:absolute;
    inset: 0;
    background-image: url('@/assets/img/sfondo.jpg');
    background-position: center;
    background-size: cover;
    pointer-events: none;
    opacity: 0.25;
  }


  @media (min-width: 1200px){
    article div {
      padding: 2rem;
    }
  }

  @media (min-width: 992px) {
    article div {
      padding: 1.75rem;
    }
  }

  @media (min-width: 768px) {
    article div {
      padding: 1.5rem;
    }
  }

  @media (min-width: 576px) {
    article div {
      padding: 1.25rem;
    }
    article div {
      padding: 1rem;
    }
  }

  .error_or_missing {
    color: red;
  }
</style>

