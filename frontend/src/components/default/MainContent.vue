<template>
    <div class="position-relative">
        <div class="d-none d-md-block bg_image mr-4  position-absolute">
            <slot name="background-img">
            </slot>
        </div>
        <div class="content w-100 d-md-flex flex-wrap pr-lg-5 d-block">
            <div class="content_left p-4">
                <slot name="tl-container">
                </slot>
            </div>
            <div class="content_right d-none d-lg-block p-3">
                <slot name="tr-container">
                </slot>
            </div>
            <div class="content_left d-none d-lg-block">
                <!--                empyt-->
            </div>
            <div class="content_right d-none d-lg-block p-3">
                <slot name="br-container">
                </slot>
            </div>
        </div>

    </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component({
    components: {},
})

export default class AboutContent extends Vue {
}
</script>

<style lang="scss" scoped>

    @import "../../styles/_variables";

    .bg_image {
        width: 85%;
        right: 0;
    }


    .content {
        /*z-index: 1;*/
        position: relative;

        @include media-breakpoint-down(md) {
            width: (100 - $menu_width);
            max-height: 80vh;
        }

        @include media-breakpoint-down(lg) {
            max-height: 80vh;
        }

        @include media-breakpoint-down(sm) {
            width: 100%;
        }

        .content_left {
            width: 65%;

            @include media-breakpoint-down(md) {
                width: 100%;
            }
        }

        .content_right {
            width: 35%;
        }
    }

    .qb {

    }

    /*.qt {
        @include media-breakpoint-up(md) {
            height: 450px;
        }

    }*/
</style>
