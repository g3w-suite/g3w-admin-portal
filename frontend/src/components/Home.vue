<template>
    <div>
        <h5 class="subtitle">{{settings.sub_title}}</h5>
        <h1 class="title">{{settings.title}}</h1>
        <p>{{settings.home_description}}</p>
    </div>

</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
import {mapGetters} from "vuex";

@Component({
    components: {},
    computed: {
        ...mapGetters({
            'settings': 'info/info'
        })
    }
})
export default class Home extends Vue {

}
</script>

<style lang="scss" scoped>

</style>
