<template>
    <div id="mainitalia" class="font-weight-normal scroll d-flex flex-column">
        <router-view name="header"></router-view>

        <router-view class="container py-5"></router-view>

    </div>
</template>

<script lang="ts">
import {Component, Prop,  Vue} from 'vue-property-decorator';

@Component({
    components: {},
})

export default class MainItalia extends Vue {
}
</script>

<style lang="scss" scoped>

    #mainitalia{
        height: 100vh;
        width: 100vw;
    }
</style>
