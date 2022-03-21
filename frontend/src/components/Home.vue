<template>
    <div>
        <h5 class="subtitle">{{settings.sub_title}}</h5>
        <h1 class="title">{{settings.title}}</h1>
        <p v-html="settings.home_description"></p>

        <div class="g3wsuitelogo-container pb-3 pl-4 d-inline">
            <span class="pwrdby font-weight-bold">Powered By&nbsp;</span> <img class="g3wsuitelogo"
                                                                               src="/static/frontend/img/logo_g3wsuite.png"
                                                                               alt="g3wlogo">
        </div>
    </div>

</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
import {mapGetters} from 'vuex';
// da migliorare? soluzione migliore?
const logo = require('@/assets/img/logo_g3wsuite.png');

@Component({
    components: {},
    computed: {
        ...mapGetters({
            settings: 'info/info',
        }),
    },
})
export default class Home extends Vue {
}
</script>

<style lang="scss" scoped>

    .g3wsuitelogo-container {
        position: fixed;
        left: 0;
        bottom: 0;

        .pwrdby {
            font-size: 0.7rem;
        }

        .g3wsuitelogo {
            width: 100px;
            height: auto;
        }
    }

</style>
