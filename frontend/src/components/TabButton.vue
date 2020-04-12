<template>
    <a :class="[active ? activeClass: '', active ? 'active' : '']"
       @click="$emit('click',idx)"
       aria-controls="nav-tab"
       aria-selected="true"
       class="nav-item nav-link"
       data-toggle="tab"
       href="#nav-tab"
       id="nav-tab1-tab"
       role="tab">{{text}}</a>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component({
    components: {},
})

export default class TabButton extends Vue {
    @Prop(Boolean) private readonly active!: boolean;
    @Prop(String) private readonly text!: string;
    @Prop(String) private readonly activeClass!: string;
    @Prop({required: true, type: Number}) private readonly idx!: number;
}
</script>

<style lang="scss" scoped>

</style>
