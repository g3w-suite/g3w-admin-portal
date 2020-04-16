<template>
    <div class="position-relative p-3 p-md-0">
        <div class="tl_content h-100 text-white p-3 p-md-5">
            <tab-widget
                    activeClass="gis_active"
            ></tab-widget>
        </div>
    </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import MainContent from '@/components/default/MainContent.vue';
import G3wButton from '@/components/default/g3wButton.vue';
import TabWidget from '@/components/TabWidget.vue';

@Component({
    components: {G3wButton, MainContent, TabWidget},
})

export default class MapsContent extends Vue {

}
</script>

<style lang="scss" scoped>

    @import "../../styles/mixin.scss";

    ::v-deep #TabNav {
        .tab-button {
            height: 50px;
            color: black;
            /*border-radius: 0;*/
            display: flex;
            justify-content: center;
            align-items: center;
            border-width: 1px;
            border-style: solid;
            /*border-color: rgba(22, 10, 64, 0.8);*/
        }
    }

    ::v-deep .gis_active {
        /*background-color: rgba(22, 10, 64, 0.8) !important;*/
        color: white !important;
        border-width: 0 !important;
    }

    /*::v-deep #TabContent {
        @include gis_gradient(30, rgba(242, 19, 123, 0.8), 0%, rgba(22, 10, 64, 0.8), 50%);
    }*/

</style>
