<template>
  <dialog id="credits-modal" ref="dialog" data-theme="light">
    <article style="max-width: unset;">
      <header style="background-color: rgb(149, 173, 54); margin-bottom: 1rem;">
        <form method="dialog">
          <input type="submit" aria-label="Close" value="" class="close contrast" />
        </form>
        <!-- <a href="#close" aria-label="Close" class="close" ></a> -->
        <div style="color: #fff">Applicativo realizzato con il framework Open Source</div>
      </header>
      <section style="text-align:center; min-width: 50vw;">
        <p>
          <a target="_blank" href="https://g3wsuite.it/" title="Applicativo realizzato con il framework OS">
            <img
              src="@/assets/img/logo_g3wsuite.png"
              alt="G3W SUITE"
              class="g3w-suite-logo"
              style="max-height: 50px;"
            >
          </a>
        </p>
        <p>Pubblica e gestisci i tuoi progetti QGIS sul Web</p>
        <address style="white-space: nowrap;">
          <span>
            <a href="https://maps.google.com/?q=V.le%20G.%20Verdi%2051016,%20Montecatini%20Terme,%20Italy" target="_blank" rel="noopener noreferrer">
              <font-awesome-icon icon="map-marker-alt" /> Montecatini Terme - Italy
            </a>
          </span>
          &nbsp;
          <span>
            <a href="tel:+393938534336">
              <font-awesome-icon icon="phone-alt" /> +39 393 8534336
            </a>
          </span>
          &nbsp;
          <span>
            <a href="mailto:info@gis3w.it"> 
              <font-awesome-icon icon="envelope" /> info@gis3w.it
            </a>
          </span>
        </address>
        <p></p>
      </section>
      <footer>
        <p>
          Framework sviluppato da
          <a href="http://www.gis3w.it" target="_blank" title="Gis3w s.n.c">
            <img src="@/assets/img/logo_gis3w_156_85.png" alt="Gis3w s.n.c" width="60">
          </a>
        </p>
      </footer>
    </article>
  </dialog>
</template>

<script lang="ts">
import dialogPolyfill from 'dialog-polyfill';
import { Component, Vue } from 'vue-facing-decorator';

@Component
export default class DialogCredits extends Vue {

  public mounted() {
    dialogPolyfill.registerDialog((this.$refs as any).dialog);
  }

  public showModal() {
    (this.$refs as any).dialog.showModal();
  }

}
</script>

<style lang="css" scoped>
  address a {
    text-decoration-line: unset;
    color: inherit;
  }
</style>