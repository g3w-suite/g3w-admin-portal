<template>
  <article class="grid">
    
    <div>
      <h2>{{settings.login_title || $tc("messages.login.title")}}</h2>

      <form @keyup.enter="login">

        <!-- USERNAME FIELD -->
        <label for="username" v-if="show_label">{{$t('messages.login.username')}}</label>
        <input
          :placeholder="usernamePlaceholder"
          autocomplete="username"
          id="username"
          required
          type="text"
          v-model="username"
        />
        <p class="error_or_missing" v-if="usernameError">{{$t('messages.login.requiredField')}}</p>

        <!-- PASSWORD FIELD -->
        <label for="password" v-if="show_label">{{$t('messages.login.password')}}</label>
        <input
          :placeholder="passwordPlaceholder"
          autocomplete="current-password"
          id="password"
          required
          type="password"
          v-model="password"
        />
        <p class="error_or_missing" v-if="passwordError">{{$t('messages.login.requiredField')}}</p>

        <!-- SUBMIT BUTTON -->
        <button
          @click="login"
          id="button"
          type="button"
          class="contrast">{{$t('messages.login.submit')}}
        </button>
        <p class="error_or_missing" v-if="loginError">{{$t('messages.login.erroreLogin')}}</p>

        <!-- RESET PASSWORD LINK -->
        <div v-if="settings.reset_password_url" >
          <a :href="settings.reset_password_url">{{$t('messages.login.reset_password_url')}}</a>
        </div>

      </form>

    </div>

    <div v-if="settings.login_description" v-html="settings.login_description"></div>
  </article>
</template>

<script lang="ts">
import { Info } from '@/types/TInfo';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { mapGetters } from 'vuex';

@Component({
  name: 'Login',
  computed: {
    ...mapGetters({
      settings: 'info/info',
    }),
  },
})
export default class Login extends Vue {

  @Prop(Boolean) public readonly showLabel!: boolean;
  @Prop(Boolean) public readonly placeholderUppercase!: boolean;

  public settings!: Info;

  public username: string = '';
  public password: string = '';

  public passwordError: boolean = false;
  public usernameError: boolean = false;
  public loginError: boolean = false;
  private extra_message: string = '';

  get passwordPlaceholder() {
    return this.password.length
      ? ''
      : (
        this.placeholderUppercase
          ? this.$tc('messages.login.password').toUpperCase()
          : this.$tc('messages.login.password')
        );
  }

  get usernamePlaceholder() {
    return this.username.length
      ? ''
      : (
        this.placeholderUppercase
          ? this.$tc('messages.login.username').toUpperCase()
          : this.$tc('messages.login.username')
        );
  }

  get show_label(): boolean {
    return undefined === this.showLabel
      ? true
      : this.showLabel;
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
      this.$store
        .dispatch('me/login', { username: this.username, password: this.password, locale: this.$i18n.locale })
        .then(() => this.$store.dispatch('me/fetchWhoAmI', { locale: this.$i18n.locale }))
        .then(() => this.$router.push({name: 'home'}))
        .catch((e) => {
          this.extra_message = e;
          this.loginError = true;
        });
    }
  }
}
</script>

<style lang="scss" scoped>
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
    background-image: url('~@/assets/img/sfondo.jpg');
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

