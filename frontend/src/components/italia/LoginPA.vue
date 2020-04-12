<template>
    <div class="pt-5">
        <login class="col-12 col-lg-6 offset-lg-3 w-100">
        </login>
    </div>
</template>

<script>
    import {Component, Prop, Vue} from "vue-property-decorator";
    import Login from "@/components/Login.vue";

    @Component({
        components: {Login},
    })

    export default class LoginPA extends Vue {

    }
</script>

<style scoped>

</style>
