<template>
    <nav>
        <div class="nav nav-tabs" id="nav-tab" role="tablist">
            <TabButton v-for="(b,idx) in tabs" :active="idx === tabs.length - 1" :activeClass="activeClass" :idx="idx" :key="idx" :text="b" @click="idx => $emit( 'click' , idx)" class="tab-button">
            </TabButton>
        </div>
    </nav>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
import TabButton from '@/components/TabButton.vue';

@Component({
    components: {TabButton},
})

export default class TabNav extends Vue {
    @Prop({type: Array, required: true}) private readonly tabs!: string[];
    @Prop(String) private readonly activeClass!: string;
}
</script>

<style lang="scss" scoped>
    .nav-tabs{
        border-bottom-color: transparent;
    }

</style>
