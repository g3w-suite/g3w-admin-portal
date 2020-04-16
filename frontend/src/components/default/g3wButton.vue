<template>
    <div
            :class="[expanded ? 'expanded-class': '', isHover ? hoverClasses: '']"
            @click="$emit('click')"
            @mouseleave="mouseLeave"
            @mouseover="mouseOver"
            @mouseout="mouseOut"
            class="g3wButton"
    >
        <slot name="default">

            <router-link
                    :to="{name:to}"
                    class="h-100 w-100 text-white d-flex justify-content-center align-items-center position-relative"
            >
                <transition name="fade">
                    <h3
                            class="text-uppercase font-weight-bold position-absolute"
                            v-show="showText">{{text_}}</h3>
                </transition>
                <transition name="fade">
                    <font-awesome-icon :icon="icon" :size="size" class="position-absolute"
                                       v-show="!showText"></font-awesome-icon>
                </transition>
            </router-link>
        </slot>
    </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component({
    components: {},
})
export default class g3wButton extends Vue {
    @Prop(String) private readonly icon!: string;
    @Prop(String) private readonly size!: string;
    @Prop(String) private readonly text!: string;
    @Prop(String) private readonly to!: string;
    @Prop(String) private readonly hoverClasses!: string;
    @Prop(Boolean) private readonly alwaysExpanded!: boolean;

    private show_text: boolean = false;
    private text_: string = this.text || '';
    private hover_: boolean = false;

    private mouseOver() {
        if (this.text_.length) {
            this.show_text = true;
        }
        this.hover_ = true;

    }

    get isHover() {
        return this.hover_;
    }

    private mouseOut() {
        this.hover_ = false;
    }

    get showText() {
        return this.show_text || this.expanded;
    }

    private mouseLeave() {
        if (this.text_.length) {
            this.show_text = false;
        }
    }

    get expanded() {
        return this.$route.name === this.to || this.alwaysExpanded;
    }
}
</script>

<style lang="scss" scoped>

    @import "../../styles/_variables.scss";

    .g3wButton {
        /*background-color: $palette_viola_fourth;*/
        opacity: 0.7;
        /*border: 1px solid $palette_viola_third;*/

        @include media-breakpoint-down(sm){
            opacity: 1;
        }
    }

    .fade-enter-active, .fade-leave-active {
        transition: opacity .5s;
    }

    .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */
    {
        opacity: 0;
    }
</style>
