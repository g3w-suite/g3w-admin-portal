<template>

  <!-- GROUP ARTICLE -->
  <article v-if="type !== boxtype.P" :class="className">
    <router-link :to="get_group_url()">
      <figure>
        <img loading="lazy" :src="img_url" @load="get_average_color" :alt="title || $t('messages.maps.group')" />
        <figcaption :style="{'--figcaption-background-color': avgColor }" ><h3><b>{{title ||  $t('messages.maps.group')}}</b></h3></figcaption>
      </figure>
    </router-link>
  </article>

  <!-- PROJECT ARTICLE -->
  <article v-else ref="article" class="grid" :class="className">

    <div>
      <figure>
        <img loading="lazy" :src="img_url" @load="get_average_color" :alt="title || description" />
      </figure>
      <p class="grid">
        <a :href="get_admin_url(map_url)" rel="noopener noreferrer" target="_blank">
          <font-awesome-icon icon="expand-arrows-alt" size="lg" />
          <span> {{ $t('messages.maps.view') }}</span>
        </a>
        <a v-if="has_edit_url()" :href="get_admin_url(edit_url)" rel="noopener noreferrer" target="_blank">
          <font-awesome-icon icon="pencil-alt" size="lg" />
          <span> {{ $t('messages.maps.edit') }}</span>
        </a>
      </p>
    </div>

    <hgroup>
      <h3>{{title}}</h3>
      <!-- <read-more :text="description" :more-str="$t('messages.readmore')" :less-str="$t('messages.readless')" link="#"  :max-chars="500"></read-more> -->
      <ReadMore :text="description" :more-str="$t('messages.readmore')" :less-str="$t('messages.readless')" link="#"  :max-chars="500"/>
      <!-- <div v-html="description"></div> -->
      <!-- <a href="#" @click.prevent="showModal">Preview</a> -->
      <a href="#" @click.prevent="showModal">{{ $t('messages.readmore') }}</a>
    </hgroup>

  </article>

  <!-- TODO: replace it with https://vuejs.org/guide/built-ins/teleport.html -->
  <Dialog ref="modal" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import { EBoxType } from '@/types/EBoxType';
import { Group } from '@/types/TGroup';
import { MacroGroup } from '@/types/TMacroGroup';
import { Project } from '@/types/TProject';
import { get_admin_url } from '@/utils';
import { useAuthStore } from '@/stores';

import Dialog from '@/components/Dialog.vue';
import ReadMore from '@/components/ReadMore.vue';
import { get_img_url } from '@/utils';

@Component({
  components: { Dialog, ReadMore },
})
export default class Article extends Vue {

  @Prop public readonly item!: Group | MacroGroup | Project;

  public avgColor: string = '0,0,0';

  public boxtype = EBoxType;

  get title(): string {
    return this.item.title;
  }

  get description(): string {
    return this.item.description;
  }

  get edit_url(): string {
    return (this.item as Project).edit_url;
  }

  get img_url(): string {
    return get_img_url(this.item.logo_img);
  }

  get map_url(): string {
    return (this.item as Project).map_url;
  }

  get className(): string {
    return EBoxType[this.type] + '-' + this.item.id + ' item-' + EBoxType[this.type];
  }

  get type(): EBoxType {
    return this.item.InstanceOf;
  }

  /**
   * Check if current project could be edited by the user (admin backend)
   */
  public has_edit_url(): boolean {
    return !!(this.type === this.boxtype.P && useAuthStore().isLoggedIn && this.edit_url);
  }

  public get_group_url(): string {
    // Macrogroups > Macrogroup
    if (this.type === this.boxtype.MG) {
      return `/${this.$i18n.locale}/organization/${this.item.id}`;
    }
    // Macrogroups > Macrogroup > Group
    if (this.type === this.boxtype.G && this.$route.name === 'organization') {
      return `/${this.$i18n.locale}/organization/${this.$route.params.id}/${this.item.id}`;
    }
    // Groups > Group
    if (this.type === this.boxtype.G) {
      return `/${this.$i18n.locale}/group/${this.item.id}`;
    }
    return '';
  }

  /**
   * Return absolute URL to G3W-ADMIN server.
   */
  public get_admin_url(folder: string): string {
    return get_admin_url(folder);
  }

  public showModal() {
    const modal = (this.$refs.modal as any).$refs.dialog;
    modal.innerHTML = `
    <article style="background-color: #fff; max-width: min(90%, 960px); margin: 0;">
      <header style="margin-bottom: 1rem;">
        <form data-method="dialog"><input type="submit" aria-label="Close" value="" class="close contrast"></form>
        <h2 style="margin: 0;">${this.title}</h2>
      </header>
      <figure><img loading="lazy" src="${this.img_url}" alt="${this.title || this.description}" style="width:100%;" /></figure>
      <div>${this.description}</div>
    </article>`;
    //modal.innerHTML += (this.$refs.article as HTMLElement).outerHTML;
    modal.showModal();
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

<style lang="css" scoped>
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

  .item-P hgroup {
    grid-column: span 2;
  }

  article.item-P {
    margin: var(--block-spacing-vertical) 0;
  }

  article.item-P:first-of-type {
    margin-top: 0;
  }
  /**
   * GROUP ARTICLE
   */
  article:is(.item-G, .item-MG) {
    padding: 0;
  }

  :is(.item-G, .item-MG) figure {
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

  :is(.item-G, .item-MG) figure > * {
    grid-area: box;
    grid-column-start: 1;
  }
  
  :is(.item-G, .item-MG) figcaption {
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

  :is(.item-G, .item-MG) figcaption > *:first-letter {
    text-transform: uppercase;
  }

  :is(.item-G, .item-MG) figcaption,
  :is(.item-G, .item-MG) figcaption > * {
    margin: 0;
    color: #fff;
    font-weight: normal;
    font-size: 1.1rem;
    text-align: left;
  }
</style>
