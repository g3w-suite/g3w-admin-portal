<template>

    <div>
        <h2 class="font-abril">{{$tc("messages.login.titolo")}}</h2>
        <h6 class="font-lato" v-html="settings.login_description"></h6>

        <form class="form">
            <div class="form-group">
                <label for="username" v-if="show_label">{{$t('messages.login.username')}}</label>
                <input :placeholder="usernamePlaceholder"
                       autocomplete="username"
                       class="form-control"
                       id="username"
                       required
                       type="text"
                       v-model="username">
                <div class="error_or_missing" v-if="usernameError">
                    {{$t('messages.validation.requiredField')}}
                </div>
            </div>
            <div class="form-group">
                <label for="password" v-if="show_label">{{$t('messages.login.password')}}</label>
                <input :placeholder="passwordPlaceholder"
                       autocomplete="current-password"
                       class="form-control"
                       id="password"
                       required
                       type="password"
                       v-model="password">
                <div class="error_or_missing" v-if="passwordError">
                    {{$t('messages.validation.requiredField')}}
                </div>
            </div>
            <div class="form-group">
                <button @click="login"
                        class="col-12 btn btn-primary"
                        id="button"
                        type="button">{{$t('messages.login.accesso')}}
                </button>
                <div class="error_or_missing mt-1" v-if="loginError">
                    {{$t('messages.validation.erroreLogin')}}
                    <p></p>
                </div>
            </div>
            <div class="form-group" v-if="settings.reset_password_url" >
                <a style="color: #ffffff !important;" :href="settings.reset_password_url">{{$t('messages.login.reset_password_url')}}</a>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
import {mapGetters} from 'vuex';


@Component({
    name: 'Login',
    computed: {
        ...mapGetters({
            settings: 'info/info',
        }),
    },
})
export default class Login extends Vue {
    @Prop(Boolean) private readonly showLabel!: boolean;
    @Prop(Boolean) private readonly placeholderUppercase!: boolean;

    private username: string = '';
    private password: string = '';
    private extra_message: string = '';

    private passwordError: boolean = false;
    private usernameError: boolean = false;
    private loginError: boolean = false;

    get passwordPlaceholder() {
        return this.password.length ? '' : (this.placeholderUppercase ? this.$tc('messages.login.password').toUpperCase() : this.$tc('messages.login.password'));
    }

    get usernamePlaceholder() {
        return this.username.length ? '' : (this.placeholderUppercase ? this.$tc('messages.login.username').toUpperCase() : this.$tc('messages.login.username'));
    }

    get show_label(): boolean {
        return this.showLabel == undefined ? true : this.showLabel;
    }

    private login() {
        if (!this.username) {
            this.usernameError = true;
        } else if (!this.password) {
            this.passwordError = true;
        } else {
            this.usernameError = false;
            this.passwordError = false;
            this.loginError = false;
            const locale = this.$i18n.locale;
            this.$store.dispatch('me/login', {
                locale,
                username: this.username,
                password: this.password,
            }).then(() => {
                return this.$store.dispatch('me/fetchWhoAmI', {locale: this.$i18n.locale});
            }).then(() => {
                this.$router.push({name: 'home'});
            }).catch((e) => {
                this.extra_message = e;
                this.loginError = true;
            });
        }
    }
}
</script>

<style>
    .error_or_missing {
        font-weight: bold;
        color: red;
    }

</style>

