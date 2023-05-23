<!--
/**
 * Reusable Vue ReadMore component
 *
 * @see https://github.com/orlyyani/read-more/
 */
-->
<template>
	<div>
		<!-- <p v-html="formattedString"> -->
    <span v-html="formattedString"></span>
    <span v-show="text.length > maxChars">
      <a :href="link" id="readmore" @click.prevent="toggleReadMore(!toggled)">{{toggled ? lessStr : moreStr}}</a>
    </span>
		<!-- </p> -->
	</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

@Component({
  components: { },
})
export default class ScrollTopArrow extends Vue {

  @Prop({ default: "Read More" }) public readonly moreStr!: string;
  @Prop({ default: "Read Less" }) public readonly lessStr!: string;
  @Prop({ required: true })       public readonly text!: string;
  @Prop({ default: '#' })         public readonly link!: string;
  @Prop({ default: 500 })         public readonly maxChars!: number;

  public toggled = false;

  get formattedString(): string {
    if (!this.toggled && this.text.length > this.maxChars) {
      return this.text.substring(0, this.maxChars) + "…";
    }
    return this.text;
  }

  public toggleReadMore(b: boolean) {
    if (this.lessStr !== null || this.lessStr !== "") this.toggled = b;
  }

};
</script>