<template>
    <div class="header w-100 d-flex">
        <div class="header_left d-flex align-items-center justify-content-between">
            <router-link :to="{name:'home'}" class="img_container d-flex align-items-center h-100 pl-md-3">
                <!--                <img class="d-none d-md-block logo_apte" src="@/assets/img/pateb.png">-->
                <!--                <img class="d-block d-md-none logo_apte" src="@/assets/img/patew.png">-->
                <img alt="logo" class="logo" :src="info.suite_logo">
            </router-link>
            <Search class="h-100 search_box d-none d-md-flex pr-md-5"
                    :class="{'d-md-flex': ($route.name === 'mappe')}"
                    v-model="search"></Search>
        </div>

        <MobileMenu class="d-block pr-3 d-md-none align-self-center"></MobileMenu>
        <div class="header_right d-none d-md-flex">
            <g3w-button
                    @click="switchLang"
                    class="tl_tounded button"
                    :class="width"
                    icon="language"
                    size="lg"
            >
                <div class="flag m-auto d-flex justify-content-center h-100 align-items-center">
                    <country-flag :country='flag' size='normal'/>
                </div>
            </g3w-button>
            <g3w-button
                    class="button"
                    :class="width"
                    :icon="Icon"
            >
                <div
                        v-if="someoneIsLogged"
                        class="h-100 w-100 text-white d-flex flex-column justify-content-center align-items-center position-relative"
                >
                    <font-awesome-icon @click="logout" :icon="Icon" size="lg"></font-awesome-icon>
                </div>
                <router-link
                        v-else
                        :to="{name:'login'}"
                        class="h-100 w-100 text-white d-flex justify-content-center align-items-center position-relative"
                >
                    <font-awesome-icon class="position-absolute" :icon="Icon" size="lg"></font-awesome-icon>
                </router-link>
            </g3w-button>
            <g3w-button
                    v-if="showAdmin && someoneIsLogged"
                    class="button d-flex d-flex justify-content-center align-items-center position-relative"
                    :class="width"
                    :icon="Icon"
            >
                <a href="/admin" rel="noopener noreferrer nofollow" class="position-absolute text-white">
                    <font-awesome-icon icon="user-shield" size="lg"></font-awesome-icon>
                </a>
            </g3w-button>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import G3wButton from '@/components/default/g3wButton.vue';
    import CountryFlag from 'vue-country-flag';
    import MobileMenu from '@/components/default/MobileMenu.vue';
    import HeaderPA from '@/components/italia/HeaderPA.vue';
    import {mapGetters} from "vuex";
    import Search from "@/components/Search.vue";

    @Component({
        components: {G3wButton, MobileMenu, CountryFlag, Search},
        computed: {
            ...mapGetters({
                'info': 'info/info',
                'showAdmin': 'settings/showAdminButton'
            })
        }
    })

    export default class Header extends HeaderPA {
        private showAdmin!: any

        get search() {
            return this.$store.getters['group/search']
        }

        set search(val: string) {
            this.$store.dispatch('group/search', {s: val})
        }

        get width() {
            if (this.showAdmin && this.someoneIsLogged) {
                return 'w-33'
            }
            return 'w-50'
        }

        get Icon() {
            if (this.someoneIsLogged) {
                return 'sign-out-alt';
            } else {
                return 'user-lock';
            }
        }

        get flag() {
            switch (this.$i18n.locale) {
                case 'en':
                    return 'it';
                case 'it':
                    return 'gb';
            }
        }

        private switchLang() {
            if (this.$root.$i18n.locale == 'it') {
                this.$root.$i18n.locale = 'en';
            } else if (this.$root.$i18n.locale == 'en') {
                this.$root.$i18n.locale = 'it';
            }
            this.$router.replace({name: this.$route.name, params: {lang: this.$root.$i18n.locale}});
            window.location.reload();
        }
    }
</script>

<style lang="scss" scoped>

    @import "../../styles/_variables.scss";

    .header {
        height: $header_height;

        .header_left {
            flex-grow: 1;

            .search_box {
                flex: 0 0 300px;
                max-width: 300px;

                .input-group-text {
                    /*border-width: 0 !important;*/
                    //color: white;
                    //background-color: $palette_1_rgb_fourth;
                }

                input {
                    /*border-width: 0 !important;*/
                    //color: white;
                    //background-color: $palette_1_rgb_fourth;
                }
            }

            .img_container {

                .logo {
                    max-height: 70%;
                    max-width: 70%;
                }
            }
        }

        .header_right {
            width: $menu_width;

            .tl_tounded {
                border-top-left-radius: $gis_rounded_radius;
            }

            .button {
                cursor: pointer;
            }
        }
    }

</style>
