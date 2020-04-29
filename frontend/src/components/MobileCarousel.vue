<template>
    <div
            class="position-relative"
            :style="style"
            style="background-position: center center">
        <span class="photo_info pr-4 pb-3"
        :style="infoStyle"
        >Photo by
            <a v-if="info.author_url" :style="infoStyle" :href="info.author_url"><u>{{info.author}}</u></a>
            <template v-else>
                {{info.author}}
            </template>
        </span>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import {mapGetters} from "vuex";
    import store from "@/store";

    @Component({
        name: 'MobileCarousel',
        components: {},
        computed: {
            ...mapGetters({
                pictures: 'settings/pictures'
            })
        }
    })
    export default class MobileCarousel extends Vue {
        private index: number = 0;

        get style() {
            if (this.$store.getters['settings/pictures'].length) {
                return {
                    //@ts-ignore
                    backgroundImage: 'url("' + this.pictures[this.index % this.pictures.length].image + '")'
                }
            }
            return {}
        }

        get infoStyle(){
            return {
                color : this.info.main_color
            }
        }

        get info() {
            //@ts-ignore
            return this.pictures[this.index % this.pictures.length]
        }

        mounted() {
            window.setInterval(() => {
                this.index++;
            }, 30000)
        }
    }
</script>

<style lang="scss" scoped>
    .photo_info {
        z-index: 100;
        position: absolute;
        bottom: 0;
        right: 0;
    }

</style>
