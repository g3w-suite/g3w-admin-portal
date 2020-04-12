<template>
    <div class="ButtonMenu">
        <div @click="toggleMenu"
             class=" innerButton rounded d-flex flex-column justify-content-around align-items-center">
            <span class="line w-100"></span>
            <span class="line w-100"></span>
            <span class="line w-100"></span>
        </div>
        <transition name="slide-fade">
            <div class="text-white mobileMenu d-flex flex-column" v-if="$store.getters['menu/isVisible']">
                <div class="d-flex">
                    <g3w-button
                            :alwaysExpanded="true"
                            @click="switchLang"
                            class="left_rounded button pointer"
                            icon="language"
                            size="lg"
                    >
                        <div class="flag m-auto d-flex justify-content-center align-items-center">
                            <country-flag :country='flag' size='normal'/>
                        </div>
                    </g3w-button>
                    <g3w-button
                            :alwaysExpanded="true"
                            :icon="Icon"
                            class="button pointer"
                    >
                        <div
                                @click="logout"
                                class="h-100 w-100 text-white d-flex justify-content-center align-items-center position-relative"
                                v-if="someoneIsLogged"
                        >
                            <font-awesome-icon :icon="Icon" class="position-absolute" size="lg"></font-awesome-icon>
                        </div>
                        <div
                                @click="goToLogin"
                                class="h-100 w-100 text-white d-flex justify-content-center align-items-center position-relative"
                                v-else
                        >
                            <font-awesome-icon :icon="Icon" class="position-absolute" size="lg"></font-awesome-icon>
                        </div>
                    </g3w-button>
                </div>
                <Menu
                        :alwaysExpanded="true"
                        @buttonClicked="$store.dispatch('menu/setVisibility',{v:false})"
                        class="d-flex flex-grow-1"
                        hoverClasses="gradient"
                >

                </Menu>
            </div>
        </transition>
    </div>

</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
import G3wButton from '@/components/default/g3wButton.vue';
import CountryFlag from 'vue-country-flag';
import Menu from '@/components/default/Menu.vue';
import HeaderPA from '@/components/italia/HeaderPA.vue';

@Component({
    components: {Menu, G3wButton, CountryFlag},
})
export default class MobileMenu extends HeaderPA {
    // private showMenu: boolean = false;

    private toggleMenu() {
        this.$store.dispatch('menu/toggleVisibility');
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
        this.$store.dispatch('menu/setVisibility', {v: false});
    }

    private goToLogin() {
        if (this.$route.name !== 'login') {
            this.$router.push({name: 'login'});
        }
        this.$store.dispatch('menu/setVisibility', {v: false});
    }

    private switchLang() {
        if (this.$root.$i18n.locale === 'it') {
            this.$root.$i18n.locale = 'en';
        } else if (this.$root.$i18n.locale === 'en') {
            this.$root.$i18n.locale = 'it';
        }
        this.$store.dispatch('menu/setVisibility', {v: false});
        this.$router.replace({name: this.$route.name, params: {lang: this.$root.$i18n.locale}});
        window.location.reload();
    }

}
</script>

<style lang="scss" scoped>

    @import "../../styles/_variables.scss";
    @import "../../styles/mixin.scss";

    .ButtonMenu {
        height: 50px;
        width: 70px;
        border: 0;
        z-index: 99;

        .innerButton {
            cursor: pointer;
            height: 100%;

            .line {
                height: 5px;
                background-color: $white;
                /*margin: 10px;*/
                border-radius: 2px;
            }
        }
    }

    .slide-fade-enter-active {
        transition: all .5s ease;
    }

    .slide-fade-leave-active {
        transition: all .5s ease;
    }

    .slide-fade-enter, .slide-fade-leave-to
        /* .slide-fade-leave-active below version 2.1.8 */
    {
        transform: translateX(100%);
        opacity: 0;
    }

    .mobileMenu {
        opacity: 0.9;
        /*background-color: $palette_viola_fourth;*/
        position: fixed;
        width: 50vw;
        top: 100px;
        right: 0;
        bottom: 0;
        z-index: 99;

        .left_rounded {
            border-top-left-radius: $gis_rounded_radius;
            border-bottom-left-radius: $gis_rounded_radius;
        }
    }

    .img_container {
        height: $header_height;

    }

    .button {
        &:hover {
            @include gis_gradient(30, rgba(242, 19, 123, 0.8), 0%, rgba(22, 10, 64, 0.8), 50%);
        }
    }

</style>
