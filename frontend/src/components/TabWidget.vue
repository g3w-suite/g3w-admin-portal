<template>
    <div class="d-flex flex-column">
        <Search v-if="$route.name === 'mappe'" class="w-100 search_box d-flex d-md-none mb-4"
                v-model="search"></Search>
        <TabNav
                :activeClass="activeClass"
                :tabs="tabs"
                @click="handleTabClick"
                id="TabNav"
        ></TabNav>
        <div class="tab-content" id="TabContent">
            <div aria-labelledby="nav-tab1-tab" class="tab-pane p-4 fade show active" id="nav-tab1" role="tabpanel">
                <div class="w-100">
                    <div class="p-2 h-100 bg-transparent">
                        <h2 class="sottotitolo font-abril">{{title}}</h2>
                        <!--                        <h6 class="titolo font-lato">{{$tc("messages.tab.sottotitolo")}}</h6>-->
                        <p class="descrizione" v-html="description"></p>
                        <div class="row">
                            <tab-box
                                    :href="mc.LogoLink"
                                    :id="mc.Id"
                                    :img_url="mc.Logo"
                                    :key="'mc_' + mc.Key"
                                    :title="mc.Title"
                                    :type="mc.InstanceOf"
                                    :edit_url="mc.edit_url"
                                    :map_url="mc.map_url"
                                    :description="mc.description"
                                    @click="handleBoxClick"
                                    :class="{
                                        'col-12 col-md-6 col-lg-4 mb-4': mc.InstanceOf != eboxtype.P,
                                        'col-12 mb-4': mc.InstanceOf == eboxtype.P
                                            }"
                                    v-for="mc in boxes">
                            </tab-box>

                        </div>
                    </div>
                </div>
            </div>
            <!--            <div class="tab-pane p-4 fade" id="nav-tab2" role="tabpanel" aria-labelledby="nav-tab2-tab">Contenuto 2</div>-->
            <!--            <div class="tab-pane p-4 fade" id="nav-tab3" role="tabpanel" aria-labelledby="nav-tab3-tab">Contenuto 3</div>-->
        </div>

        <!--        modal ingrandimento immagini-->
        <b-modal centered backdrop id="thumbnailModal" size="xl" :title="$store.getters['modal/title']">
            <template v-slot:default>
                <div>
                    <img :src="$store.getters['modal/url']" class="w-100">
                </div>
            </template>
            <template v-slot:modal-footer="footer">
                <div></div>
            </template>
        </b-modal>

    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import TabButton from '@/components/TabButton.vue';
    import {Group, IGroupDict} from '@/datastore/types/Group';
    import {IMacroGroupDict, MacroGroup} from '@/datastore/types/MacroGroup';
    import TabBox from '@/components/TabBox.vue';
    import {EBoxType} from '@/datastore/interfaces/RequestsInterfaces';
    import {SuperGroup} from '@/datastore/types/SuperGroup';
    import TabNav from '@/components/TabNav.vue';
    import {mapGetters} from "vuex";
    import {Info} from "@/datastore/types/Info";
    import Search from "@/components/Search.vue";

    // groups with no macrogroups and macrogroups

    interface IGWNM_AND_MG_Dict {
        [key: string]: IGroupDict | IMacroGroupDict;
    }

    @Component({
        components: {TabNav, TabBox, TabButton, Search},
        computed: {
            ...mapGetters({
                'settings': 'info/info'
            })
        }
    })

    export default class TabWidget extends Vue {
        public eboxtype = EBoxType;

        get search() {
            return this.$store.getters['group/search']
        }

        set search(val: string) {
            this.$store.dispatch('group/search', {s: val})
        }

        get boxes() {
            // se sono nel primo tab
            const els: Array<MacroGroup | Group> = [];
            if (this.tabs.length == 1) {
                let obj = this.$store.getters['group/macroGroups'];
                for (const i in obj) {
                    els.push(obj[i] as MacroGroup);
                }
                obj = this.$store.getters['group/groupsWithNoMacroGroup'];
                for (const i in obj) {
                    els.push(obj[i] as Group);
                }
                return els;
            } else if (this.tabs.length > 1) {
                const activeEl = this.stackElementTab[this.stackElementTab.length - 1];
                if (activeEl.InstanceOf == EBoxType.MG) {
                    return (activeEl as MacroGroup).Groups;
                }
                if (activeEl.InstanceOf == EBoxType.G) {
                    return (activeEl as Group).Projects;
                }
            }
        }

        public boxtype = EBoxType;

        @Prop(String) private readonly activeClass!: string;

        private tabs: string[] = [];
        private stackElementTab: SuperGroup[] = [];
        private settings!: Info

        public mounted() {
            this.$store.dispatch('group/fetchMacroGroups', {locale: this.$i18n.locale});
            this.$store.dispatch('group/fetchGroupsWithNoMacroGroup', {locale: this.$i18n.locale});
        }

        get title() {
            if (this.tabs.length == 1) {
                return this.settings.groups_title
            }
            return this.$store.getters['group/activeGroup'].title
        }

        get description() {
            if (this.tabs.length == 1) {
                return this.settings.groups_map_description
            }
            return this.$store.getters['group/activeGroup'].description
        }

        public created() {
            this.tabs = [this.$tc('messages.tab.firstTab')];
        }

        private handleTabClick(idx: number) {
            this.tabs.splice(idx + 1, this.tabs.length);
            this.stackElementTab.splice(idx, this.stackElementTab.length);
            this.$store.dispatch('group/setActiveGroup', {sg: this.stackElementTab[this.stackElementTab.length - 1]})
        }

        private handleBoxClick(id: number, type: EBoxType) {
            // console.log(id,type);
            let el: SuperGroup = new SuperGroup();
            if (type == EBoxType.P) {
                return false;
            }
            switch (type) {
                case EBoxType.MG:
                    el = this.$store.getters['group/macroGroups'][id];
                    (el as MacroGroup).fetchGroups();
                    break;
                case EBoxType.G:
                    el = this.$store.getters['group/groups'][id];
                    (el as Group).fetchProjects();
                    break;
            }

            this.$store.dispatch('group/setActiveGroup', {sg: el})
            this.stackElementTab = this.stackElementTab.concat(el);
            // @ts-ignore
            this.tabs = this.tabs.concat(el.title);
        }
    }
</script>

<style lang="scss">

    .search_box {
        height: 50px;

        .input-group-text {
            /*border-width: 0 !important;*/
            //color: white;
            //background-color: $palette_1_rgb_fourth;
        }

        input {
            /*border-width: 0 !important;*/
            //color: white;
            //background-color: $palette_1_rgb_fourth;
        }
    }

    #thumbnailModal {
        .modal-footer {
            height: 0;
            padding: 0;
        }

        .modal-body {
            padding: 24px;
        }
    }

    .modal-backdrop {
        opacity: 0.7;
    }

</style>
