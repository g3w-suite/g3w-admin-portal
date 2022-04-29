<template>
    <div class="Menu d-md-flex flex-column align-items-end pt-2">
        <g3w-button v-if="sections.includes('maps')" @click="$emit('buttonClicked')" :text="$t('messages.menu.mappe')" class="buttonMenu overflow-hidden flex-grow-1" icon="map-marker-alt" size="2x" to="mappe" :hoverClasses="hoverClasses" :alwaysExpanded="alwaysExpanded"></g3w-button>
        <g3w-button v-if="sections.includes('info')" @click="$emit('buttonClicked')" :text="$t('messages.menu.info')" class="buttonMenu overflow-hidden flex-grow-1" icon="info" size="2x" to="info" :hoverClasses="hoverClasses" :alwaysExpanded="alwaysExpanded"></g3w-button>
        <g3w-button v-if="sections.includes('news')" :text="$t('messages.menu.news')" @click="$emit('buttonClicked')" class="buttonMenu overflow-hidden flex-grow-1" icon="newspaper" size="2x" :hoverClasses="hoverClasses" :alwaysExpanded="alwaysExpanded"></g3w-button>
        <g3w-button v-if="sections.includes('archives')" @click="$emit('buttonClicked')" :text="$t('messages.menu.archivi')" class="buttonMenu overflow-hidden flex-grow-1" icon="inbox" size="2x" :hoverClasses="hoverClasses" :alwaysExpanded="alwaysExpanded"></g3w-button>
    </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
import G3wButton from '@/components/default/g3wButton.vue';
import {mapGetters} from 'vuex';

@Component({
    components: {G3wButton},
    computed: {
        ...mapGetters({
            sections: 'settings/portalSections',
        }),
    },
})

export default class Menu extends Vue {
    @Prop(Boolean) private readonly alwaysExpanded!: boolean;
    @Prop(String) private readonly hoverClasses!: string;
}
</script>

<style lang="scss" scoped>
    @import "../../styles/_variables";

    .left_rounded {
        border-top-left-radius: $gis_rounded_radius;
        border-bottom-left-radius: $gis_rounded_radius;
    }
    ::v-deep .expanded-class {
        width: 100% !important;
    }
    .buttonMenu {}
    .Menu {
        background-color: transparent;
        .buttonMenu {
            @extend .left_rounded;
            cursor: pointer;
            transition: 500ms;
            margin-bottom: 2px;
            max-height: 250px;
            width: 50%;
            &:hover {
                width: 100%;
            }
        }
    }
</style>
