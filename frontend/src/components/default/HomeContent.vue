<template>
    <MainContent>
        <template slot="background-img">
            <transition-group name="fade">
                <img alt="bg" v-if="(index % pictures.length) == idx" v-for="(i,idx) in pictures" :key="i.id" class="position-absolute w-100 d-none d-md-block sfondo" :src="i.image"/>
            </transition-group>
        </template>

        <template slot="tl-container">
            <div class="tl_content h-100 gradient text-white p-3">
                <home class="h-100 w-100 d-flex flex-column p-3" id=Home>
                </home>
            </div>
        </template>

    </MainContent>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import MainContent from '@/components/default/MainContent.vue';
    import Home from '@/components/Home.vue';
    import {mapGetters} from "vuex";
    import {IPictures} from "@/datastore/interfaces/PortalInterface";

    @Component({
        components: {MainContent, Home},
        computed:{
            ...mapGetters({
                pictures: 'settings/pictures'
            })
        }
    })
    export default class HomeContent extends Home {
        private index: number = 0;

        mounted() {
            window.setInterval(() => {
                this.index++;
            }, 2000)
        }
    }
</script>

<style lang="scss">

    @import "../../styles/_variables";

    .tl_content {
        border-top-left-radius: $gis_rounded_radius;
    }

    #Home {
        .title {
            font-family: 'Abril Fatface', cursive;
        }

        .subtitle {
            font-family: 'Lato', sans-serif;
        }
    }

    .sfondo{
        transition: opacity 1000ms;
    }

    .fade-enter{
        opacity: 0;
    }

    .fade-enter-to{
        opacity: 1;
    }

    .fade-leave{
        opacity: 1;
    }
    .fade-leave-to{
        opacity: 0;
    }
</style>
