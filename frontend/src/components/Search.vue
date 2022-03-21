<template>
    <div class="input-group">
        <div class="input-group-prepend">
                    <span class="input-group-text">
                        <font-awesome-icon icon="search" size="lg"></font-awesome-icon>
                    </span>
        </div>
        <input type="text" class="form-control h-100" :placeholder="$t('messages.menu.cerca')" aria-label="CERCA"
               v-bind:value="value"
                v-on:input="$emit('input', $event.target.value)">
    </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component({
    components: {},
    name: 'Search',
})

export default class Search extends Vue {
    @Prop(String) private readonly value!: string;
}
</script>

<style scoped lang="scss">

</style>