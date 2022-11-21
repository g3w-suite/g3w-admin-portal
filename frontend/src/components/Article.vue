<template>

  <!-- PROJECT ARTICLE -->
  <article v-if="type !== boxtype.P">

    <figure style="cursor:pointer;" @click="$emit('click', id, type)">
      <img loading="lazy" :src="img_url" @load="get_average_color" />
      <figcaption :style="{'--figcaption-background-color': avgColor }" ><h3>{{title ||  $t('messages.maps.group')}}</h3></figcaption>
    </figure>
 
  </article>

  <!-- GROUP ARTICLE -->
  <article v-else>

    <p class="grid">
      <a :href="map_url" rel="noopener noreferrer" target="_blank">
        <font-awesome-icon icon="expand-arrows-alt" size="lg" />
        <span> View</span>
      </a>
      <a v-if="type === boxtype.P && $store.getters['me/isLoggedIn']" :href="edit_url" rel="noopener noreferrer" target="_blank">
        <font-awesome-icon icon="pencil-alt" size="lg" />
        <span> Edit</span>
      </a>
    </p>

    <figure>
      <img loading="lazy" :src="img_url" @load="get_average_color" />
    </figure>

    <hgroup>
      <h3>{{title}}</h3>
      <div v-if="description" v-html="description"></div>
    </hgroup>

  </article>

</template>

<script lang="ts">
import { EBoxType } from '@/types/EBoxType';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  components: {},
})
export default class TabBox extends Vue {

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
   * Compute the avergare color of a image
   */
  public get_average_color(src: string = this.img_url) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
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

  article > figure {
    position: relative;
  }

  article > figure > img {
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

  /**
   * GROUP ARTICLE
   */
  article.boxtype_G {
    padding: 0;
  }

  .boxtype_G figure {
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

  .boxtype_G figure > * {
    grid-area: box;
  }
  
  .boxtype_G figcaption {
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

  .boxtype_G figcaption > *:first-letter {
    text-transform: uppercase;
  }

  .boxtype_G figcaption, .boxtype_G figcaption > * {
    margin: 0;
    color: #fff;
    font-weight: normal;
    font-size: 1.1rem;
    text-align: left;
  }
</style>
