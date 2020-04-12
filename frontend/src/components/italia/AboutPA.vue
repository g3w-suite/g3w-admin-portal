<template>
    <div>

        <h2>{{about.about_title}}</h2>
        <h6>Testo piccolo che non so cosa sia</h6>
        <p>{{about.about_description}}</p>

        <InfoCard
                :text="about.about_name"
                :title="$t('messages.about.chisiamo')"
                class="text-capitalize"
        >
        </InfoCard>

        <InfoCard
                :text="telHref"
                :title="$t('messages.about.telefono')"
                class="text-capitalize">
            <template v-slot:default="ref">
                <a :href="ref.text">{{ref.text}}</a>
            </template>
        </InfoCard>

        <InfoCard
                :text="emailHref"
                :title="$t('messages.about.email')"
                class="text-capitalize">
            <template v-slot:default="ref">
                <a :href="ref.text">{{ref.text}}</a>
            </template>
        </InfoCard>

        <InfoCard
                :text="about.about_address"
                :title="$t('messages.about.dovesiamo')"
                class="text-capitalize">
        </InfoCard>

        <InfoCard
                :title="$t('messages.about.social')"
                class="text-capitalize">
            <template>
                <div class="row">
                    <a :href="about.facebook_url.length" class="col-12 col-md-6 col-lg-4" v-if="about.facebook_url">
                        <svg class="icon">
                            <use xlink:href="/static/frontend/bootstrap-italia/svg/sprite.svg#it-facebook"></use>
                        </svg>
                        it-facebook
                    </a>
                    <a :href="about.instagram_url.length" class="col-12 col-md-6 col-lg-4" v-if="about.instagram_url">
                        <svg class="icon">
                            <use xlink:href="/static/frontend/bootstrap-italia/svg/sprite.svg#it-instagram"></use>
                        </svg>
                        it-instagram
                    </a>
                    <a :href="about.twitter_url.length" class="col-12 col-md-6 col-lg-4" v-if="about.twitter_url">
                        <svg class="icon">
                            <use xlink:href="/static/frontend/bootstrap-italia/svg/sprite.svg#it-twitter"></use>
                        </svg>
                        it-twitter
                    </a>
                    <a :href="about.linkedin_url.length" class="col-12 col-md-6 col-lg-4" v-if="about.linkedin_url">
                        <svg class="icon">
                            <use xlink:href="/static/frontend/bootstrap-italia/svg/sprite.svg#it-linkedin"></use>
                        </svg>
                        it-linkedin
                    </a>
                </div>
            </template>
        </InfoCard>
    </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
import InfoCard from '@/components/InfoCard.vue';

@Component({
    components: {InfoCard},
})
export default class AboutPA extends Vue {
    get about() {
        return this.$store.getters['info/info'];
    }

    // public created() {
    //     this.$store.dispatch('info/fetchInfo');
    // }

    get telHref() {
        return 'tel:' + this.about.about_tel;
    }

    get emailHref() {
        return 'to:' + this.about.about_email;
    }
}
</script>

<style lang="scss" scoped>


</style>
