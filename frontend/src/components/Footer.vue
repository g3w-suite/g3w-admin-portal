<template>
  <footer id="footer" data-theme="dark" style="background-color: var(--background-color); padding-bottom: 0;">
    <section class="container" style="margin-bottom: 0;">
      <div class="grid">

        <div>
          <span style="display:block; font-size: 1.5rem; font-weight: 700; color: var(--h1-color);">{{info.about_title}}</span>
          <p>{{info.about_description}}</p>
        </div>

        <address>
          <h3>{{$t('messages.footer.contacts')}}</h3>

          <p>
            <font-awesome-icon icon="user" /> {{info.about_name}}
          </p>

          <p>
            <a :href="`tel:${info.about_tel}`">
              <font-awesome-icon icon="phone-alt" /> {{info.about_tel}}
            </a>
          </p>
          
          <p>
            <a :href="`mailto: ${info.about_email}`">
              <font-awesome-icon icon="envelope" /> {{info.about_email}}
            </a>
          </p>

          <p>
            <a :href="'https://maps.google.com/?q=' + info.about_address" target="_blank" rel="noopener noreferrer">
              <font-awesome-icon icon="map-marker-alt" /> {{info.about_address}}
            </a>
          </p>

          <p class="social-icons">
            <a v-if="info.facebook_url" :href="info.facebook_url" aria-label="Youtube">
              <font-awesome-icon :icon="['fab', 'facebook-square']" size="lg" />
            </a>
            <a v-if="info.twitter_url" :href="info.twitter_url" aria-label="Twitter">
              <font-awesome-icon :icon="['fab', 'twitter-square']" size="lg" />
            </a>
            <a v-if="info.googleplus_url" :href="info.googleplus_url" aria-label="Google Plus">
              <font-awesome-icon :icon="['fab', 'google-plus-square']" size="lg" />
            </a>
            <a v-if="info.youtube_url" :href="info.youtube_url" aria-label="Youtube">
              <font-awesome-icon :icon="['fab', 'youtube']" size="lg" />
            </a>
            <a v-if="info.instagram_url" :href="info.instagram_url" aria-label="Instagram">
              <font-awesome-icon :icon="['fab', 'instagram']" size="lg" />
            </a>
            <a v-if="info.flickr_url" :href="info.flickr_url" aria-label="Flickr">
              <font-awesome-icon :icon="['fab', 'flickr']" size="lg"></font-awesome-icon>
            </a>
            <a v-if="info.tripadvisor_url" :href="info.tripadvisor_url" aria-label="Trip Advisor">
              <font-awesome-icon :icon="['fab', 'tripadvisor']" size="lg"></font-awesome-icon>
            </a>
          </p>

        </address>

      </div>
    </section>
    <!-- TODO: allow users to edit cookie, privacy and credits links -->
    <nav style="background-color: var(--contrast-inverse);">
      <div class="container">
        <ul>
          <li v-if="info.cookiepolicy_url">
            <a :href="info.cookiepolicy_url" class="contrast">Cookie</a>
          </li>
          <li v-if="info.privacypolicy_url">
            <a :href="info.privacypolicy_url" class="contrast">Privacy</a>
          </li>
          <li v-if="info.credits_url">
            <a :href="info.credits_url" class="contrast">Credits</a>
          </li>
        </ul>
      </div>
    </nav>
  </footer>
</template>

<script lang="ts">
import { Info } from '@/types/TInfo';
import { Component, Vue } from 'vue-property-decorator';
import { mapGetters } from 'vuex';

@Component({
  components: { },
  computed: {
    ...mapGetters({
      info: 'info/info',
    }),
  },
})

export default class Footer extends Vue {
  public info!: Info;
}
</script>

<style lang="scss" scoped>
  .social-icons a {
    margin: 0 1ch;
  }
  .social-icons a:first-of-type {
    margin-left: 0;
  }
  address a {
    text-decoration-line: unset;
    color: inherit;
  }
</style>