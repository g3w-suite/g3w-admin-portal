<template>
    <div
    :style="style">

    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import {mapGetters} from "vuex";
    import store from "@/store";

    @Component({
        name:'MobileCarousel',
        components: {},
        computed:{
            ...mapGetters({
                pictures: 'settings/pictures'
            })
        }
    })
    export default class MobileCarousel extends Vue {
        private index: number = 0;
        get style(){
            if(this.$store.getters['settings/pictures'].length){
                return {
                //@ts-ignore
                backgroundImage: 'url("'+ this.pictures[this.index % this.pictures.length].image+'")'
            }
            }
            return {
            }
        }
        mounted() {
            window.setInterval(() => {
                this.index++;
            }, 2000)
        }
    }
</script>

<style lang="scss" scoped>

</style>
