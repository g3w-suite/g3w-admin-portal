<template>
    <div id="mainitalia" class="font-weight-normal scroll d-flex flex-column">
        <router-view name="header"></router-view>
        <router-view class="container py-5"></router-view>
    </div>
</template>

<script lang="ts">
import {Component,  Vue} from 'vue-property-decorator';

@Component({
    components: {},
})

export default class MainItalia extends Vue {
    get search() {
        return this.$store.getters['group/search'];
    }

    set search(val: string) {
        this.$store.dispatch('group/search', {s: val});
    }
}
</script>

<style lang="scss" scoped>
    #mainitalia{
        height: 100vh;
        width: 100vw;
    }
</style>
