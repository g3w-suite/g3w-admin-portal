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

