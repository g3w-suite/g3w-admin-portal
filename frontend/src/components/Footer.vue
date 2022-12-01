<template>
  <fragment>
    <footer id="footer" data-theme="dark" style="background-color: var(--background-color); padding-bottom: 0;">
      <section class="container" style="margin-bottom: 0;">
        <div class="grid">

          <div>
            <span style="display:block; font-size: 1.5rem; font-weight: 700; color: var(--h1-color);">{{info.about_title}}</span>
            <div v-html="info.about_description"></div>
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
              <!-- DEPRECATED: https://github.com/FortAwesome/Font-Awesome/issues/18180 -->
              <a v-if="info.tripadvisor_url" :href="info.tripadvisor_url" aria-label="Trip Advisor">
                <font-awesome-icon :icon="['fab', 'tripadvisor']" size="lg"></font-awesome-icon>
              </a>
            </p>

          </address>

        </div>
      </section>
      <nav style="background-color: var(--contrast-inverse);">
        <div class="container">
          <ul>
            <li v-if="info.cookie_policy_url">
              <a :href="info.cookie_policy_url" class="contrast">Cookie</a>
            </li>
            <li v-if="info.privacy_policy_url">
              <a :href="info.privacy_policy_url" class="contrast">Privacy</a>
            </li>
            <li v-if="info.credits_url">
              <a :href="info.credits_url" class="contrast" @click.prevent="showModal">Credits</a>
            </li>
          </ul>
        </div>
      </nav>
    </footer>
    <!-- TODO: add a reusable dialog component -->
    <dialog id="credits-modal">
      <article>
        <header style="background-color: rgb(149, 173, 54); margin-bottom: 1rem;">
          <form method="dialog">
            <input type="submit" aria-label="Close" value="" class="close" />
          </form>
          <!-- <a href="#close" aria-label="Close" class="close" ></a> -->
          <a target="_blank" href="https://g3wsuite.it/" title="Applicativo realizzato con il framework OS">
            <img
              src="/static/client/images/g3wsuite_logo.png"
              alt="G3W SUITE"
              class="g3w-suite-logo"
              style="max-height: 50px;"
            >
          </a>
          <div style="color: #fff">Applicativo realizzato con il framework Open Source</div>
        </header>
        <div>
          <p>Pubblica e gestisci i tuoi progetti QGIS sul Web</p>
          <div class="credit-title-logo g3w-credits-block">
              Framework sviluppato da
              <a href="http://www.gis3w.it" target="_blank" style="text-align: center;">
                <img src="/static/client/images/logo_gis3w_156_85.png" alt="" class="img-responsive center-block" style="margin-left: 5px;" width="60">
              </a>
          </div>
          <address id="address-credits" style="line-height: 1.3; text-align: center; margin-top: 5px; display: flex; justify-content: center;">
            <span style="padding: 2px;">
              <span aria-hidden="true" class="fas fa-map-marker-alt" style="color: rgb(149, 173, 54); font-weight: bold;"></span> Montecatini Terme - Italy
            </span>
            <span style="padding: 2px;">
              <span aria-hidden="true" class="fas fa-mobile" style="color: rgb(149, 173, 54);"></span> +39 393 8534336
            </span>
            <span style="padding: 2px;">
              <span aria-hidden="true" class="fas fa-envelope" style="color: rgb(149, 173, 54);"></span> <a href="mailto:info@gis3w.it" style="color: rgb(0, 0, 0);"> info@gis3w.it</a>
            </span>
          </address>
        </div>
        <p>test custom credits</p>
      </article>
    </dialog>
  </fragment>
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

  public showModal(){
    (window as any).document.querySelector('#credits-modal').showModal();
  }
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