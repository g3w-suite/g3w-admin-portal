<template>
    <MainContent>

        <template slot="tl-container">
            <div class="h-100 gradient text-white p-3">
                <div class="scroll-auto h-100 w-100 pl-3 pr-2 pl-md-5">
                    <div class="py-2">
                        <h2 class="font-abril">{{settings.about_title}}</h2>
                    </div>
                    <div class="py-5" v-html="settings.about_description"></div>

                    <!--            mobile template-->
                    <div class="d-block d-lg-none mobile-template">
                        <!--                info widget-->
                        <info-widget :text="settings.about_name" class="mb-2 ml-n3 ml-md-0" icon="user"></info-widget>
                        <info-widget :text="settings.about_tel" class="mb-2 ml-n3 ml-md-0" icon="phone-alt">
                            <a :href="telHref" class="text-white">{{settings.about_tel}}</a>
                        </info-widget>
                        <info-widget :text="settings.about_email" class="mb-2 ml-n3 ml-md-0" icon="envelope">
                            <a :href="emailHref" class="text-white">{{settings.about_email}}</a>
                        </info-widget>
                        <info-widget :text="settings.about_address" class="mb-2 ml-n3 ml-md-0" icon="map-marker-alt">
                        </info-widget>
                        <!--                social login-->
                        <div class="ml-n3 ml-md-0 py-3">
                            <a :href="settings.facebook_url" class="mr-3 mb-2 text-white" v-if="settings.facebook_url.length">
                                <font-awesome-icon :icon="['fab', 'facebook-square']" size="2x"></font-awesome-icon>
                            </a>
                            <a :href="settings.twitter_url" class="mr-3 mb-2 text-white" v-if="settings.twitter_url && settings.twitter_url.length">
                                <font-awesome-icon :icon="['fab', 'twitter-square']" size="2x"></font-awesome-icon>
                            </a>
                            <a :href="settings.googleplus_url" class="mr-3 mb-2 text-white" v-if="settings.googleplus_url && settings.googleplus_url.length">
                                <font-awesome-icon :icon="['fab', 'google-plus-square']" size="2x"></font-awesome-icon>
                            </a>
                            <a :href="settings.youtube_url" class="mr-3 mb-2 text-white" v-if="settings.youtube_url && settings.youtube_url.length">
                                <font-awesome-icon :icon="['fab', 'youtube']" size="2x"></font-awesome-icon>
                            </a>
                            <a :href="settings.instagram_url" class="mr-3 mb-2 text-white" v-if="settings.instagram_url && settings.instagram_url.length">
                                <font-awesome-icon :icon="['fab', 'instagram']" size="2x"></font-awesome-icon>
                            </a>
                            <a :href="settings.flickr_url" class="mr-3 mb-2 text-white" v-if="settings.flickr_url && settings.flickr_url.length">
                                <font-awesome-icon :icon="['fab', 'flickr']" size="2x"></font-awesome-icon>
                            </a>
                            <a :href="settings.tripadvisor_url" class="mr-3 mb-2 text-white" v-if="settings.tripadvisor_url && settings.tripadvisor_url.length">
                                <font-awesome-icon :icon="['fab', 'tripadvisor']" size="2x"></font-awesome-icon>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template slot="tr-container">
            <div class="h-100 w-100 gradient d-none d-md-flex flex-column p-5 text-white">
                <info-widget :text="settings.about_name" class="mb-2" icon="user"></info-widget>
                <info-widget :text="settings.about_tel" class="mb-2" icon="phone-alt">
                    <a :href="telHref" class="text-white p-0">{{settings.about_tel}}</a>
                </info-widget>
                <info-widget :text="settings.about_email" class="mb-2" icon="envelope">
                    <a :href="emailHref" class="text-white p-0">{{settings.about_email}}</a>
                </info-widget>
                <info-widget :text="settings.about_address" class="mb-2" icon="map-marker-alt"></info-widget>
            </div>
        </template>

        <template slot="br-container">
            <div class="br_content h-100 w-100 gradient text-white qb px-5 py-3">
                <a :href="settings.facebook_url" class="mr-3 mb-2 text-white" v-if="settings.facebook_url && settings.facebook_url.length">
                    <font-awesome-icon :icon="['fab', 'facebook-square']" size="lg"></font-awesome-icon>
                </a>
                <a :href="settings.twitter_url" class="mr-3 mb-2 text-white" v-if="settings.twitter_url && settings.twitter_url.length">
                    <font-awesome-icon :icon="['fab', 'twitter-square']" size="lg"></font-awesome-icon>
                </a>
                <a :href="settings.googleplus_url" class="mr-3 mb-2 text-white" v-if="settings.googleplus_url && settings.googleplus_url.length">
                    <font-awesome-icon :icon="['fab', 'google-plus-square']" size="lg"></font-awesome-icon>
                </a>
                <a :href="settings.youtube_url" class="mr-3 mb-2 text-white" v-if="settings.youtube_url && settings.youtube_url.length">
                    <font-awesome-icon :icon="['fab', 'youtube']" size="lg"></font-awesome-icon>
                </a>
                <a :href="settings.instagram_url" class="mr-3 mb-2 text-white" v-if="settings.instagram_url && settings.instagram_url.length">
                    <font-awesome-icon :icon="['fab', 'instagram']" size="lg"></font-awesome-icon>
                </a>
                <a :href="settings.flickr_url" class="mr-3 mb-2 text-white" v-if="settings.flickr_url && settings.flickr_url.length">
                    <font-awesome-icon :icon="['fab', 'flickr']" size="lg"></font-awesome-icon>
                </a>
                <a :href="settings.tripadvisor_url" class="mr-3 mb-2 text-white" v-if="settings.tripadvisor_url && settings.tripadvisor_url.length">
                    <font-awesome-icon :icon="['fab', 'tripadvisor']" size="lg"></font-awesome-icon>
                </a>
            </div>
        </template>
    </MainContent>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import InfoWidget from '@/components/InfoWidget.vue';
import MainContent from '@/components/default/MainContent.vue';
import {mapGetters} from 'vuex';

@Component({
    name: 'AboutContent',
    components: {MainContent, InfoWidget},
    computed: {
        ...mapGetters({
            settings: 'info/info',
        }),
    },
})

export default class AboutContent extends Vue {
    private settings: any;

    get telHref() {
        return `tel: ${this.settings.about_tel}`;
    }

    get emailHref() {
        return `mailto: ${this.settings.about_email}`;
    }

}
</script>

<style lang="scss" scoped>
    @import "../../styles/_variables";
    .bg_image {
        width: 85%;
        right: 0;
    }

    .tl_content {
        @include media-breakpoint-down(md) {
            height: 80vh !important;
        }
    }
    .tr_content, .br_content {
        //border-top-left-radius: $gis_rounded_radius;
    }

    .qt {
        height: 450px;
    }
</style>
