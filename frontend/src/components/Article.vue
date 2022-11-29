<template>

  <!-- GROUP ARTICLE -->
  <article v-if="type !== boxtype.P">
    <router-link :to="(type === boxtype.MG ? '/organization/' : '/group/' ) + id">
      <figure>
        <img loading="lazy" :src="img_url" @load="get_average_color" :alt="title || $t('messages.maps.group')" />
        <figcaption :style="{'--figcaption-background-color': avgColor }" ><h3><b>{{title ||  $t('messages.maps.group')}}</b></h3></figcaption>
      </figure>
    </router-link>
   </article>

  <!-- PROJECT ARTICLE -->
  <article v-else  class="grid">

    <div>
      <figure>
        <img loading="lazy" :src="img_url" @load="get_average_color" :alt="title || description" />
      </figure>
      <p class="grid">
        <a :href="get_admin_url(map_url)" rel="noopener noreferrer" target="_blank">
          <font-awesome-icon icon="expand-arrows-alt" size="lg" />
          <span> {{ $t('messages.maps.view') }}</span>
        </a>
        <a v-if="type === boxtype.P && $store.getters['me/isLoggedIn']" :href="get_admin_url(edit_url)" rel="noopener noreferrer" target="_blank">
          <font-awesome-icon icon="pencil-alt" size="lg" />
          <span> {{ $t('messages.maps.edit') }}</span>
        </a>
      </p>
    </div>

    <hgroup>
      <h3>{{title}}</h3>
      <div v-html="description"></div>
    </hgroup>

  </article>

</template>

<script lang="ts">
import { EBoxType } from '@/types/EBoxType';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  components: {},
})
export default class Article extends Vue {

  public boxtype = EBoxType;

  @Prop(String) public readonly title!: string;
  @Prop(String) public readonly href!: string;
  @Prop(String) public readonly img_url!: string;
  @Prop(Number) public readonly type!: number;
  @Prop(Number) public readonly id!: number;
  @Prop(String) public readonly edit_url!: string;
  @Prop(String) public readonly map_url!: string;
  @Prop(String) public readonly description!: string;

  public avgColor: string = '0,0,0';

  /**
   * Return absolute URL to G3W-ADMIN server.
   */
  public get_admin_url(folder: string): string {
    return process.env.VUE_APP_ADMIN_URL + folder;
  }

  /**
   * Compute the avergare color of a image
   */
  public get_average_color(src: string | any = this.img_url): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    src = (src.target && src.target.src) || src;
    img.setAttribute('crossOrigin', '');
    img.src = src;
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      // rescale the image to 1x1
      ctx.drawImage(img, 0, 0, 1, 1);
      // get resulting pixel color
      this.avgColor = ctx.getImageData(0, 0, 1, 1).data.slice(0, 3).toString();
    }
    // console.log(this.avgColor);
    return this.avgColor;
  }

}
</script>

<style lang="scss" scoped>
  /**
   * PROJECT ARTICLE
   */
  article {
    padding: var(--block-spacing-horizontal);
  }

  article figure {
    position: relative;
  }

  article figure > img {
    aspect-ratio: 1;
    min-height: 200px;
    object-fit: cover;
    height: 100%;
    width: 100%;
  }

  figure .fa-expand-arrows-alt {
    position: absolute;
    color: #fff;
    margin: 1rem;
    left: 0;
  }

  .boxtype_P hgroup {
    grid-column: span 2;
  }

  article.boxtype_P {
    margin: var(--block-spacing-vertical) 0;
  }

  article.boxtype_P:first-of-type {
    margin-top: 0;
  }
  /**
   * GROUP ARTICLE
   */
  article:is(.boxtype_G, .boxtype_MG) {
    padding: 0;
  }

  :is(.boxtype_G, .boxtype_MG) figure {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    grid-area: box;
    place-items: center;
    place-content: center stretch;
    place-self: center stretch;
    display: grid;
    position: relative;
  }

  :is(.boxtype_G, .boxtype_MG) figure > * {
    grid-area: box;
  }
  
  :is(.boxtype_G, .boxtype_MG) figcaption {
    color: #fff;
    place-self: start stretch;
    background: transparent;
    margin: 1em 2em;
    pointer-events: none;
    z-index: 1;
    text-align: center;
    background: rgb(var(--figcaption-background-color), 0.25);
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  :is(.boxtype_G, .boxtype_MG) figcaption > *:first-letter {
    text-transform: uppercase;
  }

  :is(.boxtype_G, .boxtype_MG) figcaption,
  :is(.boxtype_G, .boxtype_MG) figcaption > * {
    margin: 0;
    color: #fff;
    font-weight: normal;
    font-size: 1.1rem;
    text-align: left;
  }
</style>
