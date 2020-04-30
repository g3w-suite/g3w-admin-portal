<template>
    <div>
        <a :href="map_url" class="d-block aspect_16_9 map-img" rel="noopener noreferrer"
           target="_blank"
           v-if="type === eboxtype.P">
            <div
                    class="img_container d-flex text-white square_inner bg-white overflow-hidden">
                <font-awesome-icon @click="expand" class="expand-arrow m-3 position-absolute"
                                   icon="expand-arrows-alt"
                                   size="lg"></font-awesome-icon>
                <a
                        :href="edit_url"
                        rel="noopener noreferrer"
                        target="_blank"
                        v-if="type === eboxtype.P"
                >
                    <font-awesome-icon class="   pencil m-3 position-absolute" icon="pencil-alt"
                                       size="lg"></font-awesome-icon>
                </a>
                <img :src="img_url" class="thumbnail align-self-center w-100"/>
            </div>
        </a>
        <div @click="$emit('click', id, type)"
             class="aspect_16_9 map-img"
             v-else>
            <div
                    class="img_container d-flex text-white square_inner bg-white overflow-hidden">
                <font-awesome-icon @click="expand" class="expand-arrow m-3 position-absolute"
                                   icon="expand-arrows-alt"
                                   size="lg"></font-awesome-icon>
                <a
                        :href="edit_url"
                        v-if="type === eboxtype.P"
                >
                    <font-awesome-icon class="   pencil m-3 position-absolute" icon="pencil-alt"
                                       size="lg"></font-awesome-icon>
                </a>
                <img :src="img_url" class="thumbnail align-self-center w-100"/>
            </div>
        </div>
        <div class="text-uppercase text-black title mt-3 bg-white d-flex justify-content-center align-items-center position-relative">
            <p class="px-2 title_ellipsis">{{title}}</p>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import {EBoxType} from '@/datastore/interfaces/RequestsInterfaces';

    @Component({
        components: {},
    })
    export default class TabBox extends Vue {

        public eboxtype = EBoxType;
        @Prop(String) private readonly title!: string;
        @Prop(String) private readonly href!: string;
        @Prop(String) private readonly img_url!: string;
        @Prop(Number) private readonly type!: number;
        @Prop(Number) private readonly id!: number;
        @Prop(String) private readonly edit_url!: string;
        @Prop(String) private readonly map_url!: string;

        private expand(e: MouseEvent) {
            e.preventDefault();
            e.stopPropagation();
            this.$store.dispatch('modal/setTitle', {title: this.title || ''});
            this.$store.dispatch('modal/setUrl', {url: this.img_url || ''});
            this.$bvModal.show('thumbnailModal');
        }
    }
</script>

<style lang="scss" scoped>

    @import "../styles/mixin";

    .map-img {
        &:hover {
            background-color: gray;
        }
    }

    .title {
        height: 50px;

        .title_ellipsis {
            position: absolute;
            left: 0;
            right: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    .expand-arrow {
        cursor: pointer;

        &:hover {
            color: blue;
        }
    }

    .pencil {
        cursor: pointer;
        right: 0;
        color: white;

        &:hover {
            color: blue;
        }
    }

    .img_container {
        cursor: pointer;
        position: relative;

        &:hover::before {
            @include trbl(0, 0, 0, 0);
            content: "";
            position: absolute;
            background-color: rgba(0, 0, 0, 0.4);
        }
    }

</style>
