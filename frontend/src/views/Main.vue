<template>
    <div class="scroll vh-100 d-flex flex-column" id="main" :class="[$store.getters['menu/isVisible'] ? 'overlay' : '']">
        <MobileCarousel v-if="$route.name === 'home'" class="d-md-none d-block vh-100 w-100 position-absolute bg_image"></MobileCarousel>
        <div class="z-100 header d-flex py-4 pl-4 pr-4 pr-md-0">
            <router-view name="header"></router-view>
        </div>
        <div class="body px-0 pl-md-4 pr-md-0 flex-grow-1 align-items-stretch">
            <div class="info d-flex h-100">
                <router-view class="content"></router-view>
                <router-view class="d-none d-md-block menu" name="menu"></router-view>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import MobileCarousel from '@/components/MobileCarousel.vue';

@Component({
    components: {MobileCarousel},
})
export default class Main extends Vue {

}
</script>

<style lang="scss">
    @import '../styles/_variables.scss';
    @import '../styles/mixin';
    #main.overlay{
        @include media-breakpoint-down(sm) {
            &:after {}
        }
    }
    .content {
        @include media-breakpoint-down(sm) {
            width: 100%;
        }
        width: (100 - $menu_width);
    }
    .menu {
        width: $menu_width;
    }
</style>
