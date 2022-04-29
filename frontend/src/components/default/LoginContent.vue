<template>
    <MainContent>
        <template slot="tl-container">
            <div class="tl_content h-100 gradient text-white p-3">
                <login :placeholderUppercase="true" class="h-100 w-100 d-flex flex-column p-3" id="loginForm"></login>
            </div>
        </template>
    </MainContent>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import MainContent from '@/components/default/MainContent.vue';
import Login from '@/components/Login.vue';

@Component({
    components: {MainContent, Login},
})

export default class LoginContent extends Vue {
}
</script>

<style lang="scss">
    @import "../../styles/_variables";
    #loginForm {
        .form {
            width: 50%;
            display: flex;
            flex-direction: column;
            align-self: center;
            margin-top: 2rem;
            @include media-breakpoint-down(sm) {
                width: 100% !important;
            }
            #username {
                height: 50px;
                border-radius: 0;
                color: white;
                background-color: transparent;
            }
            #password {
                height: 50px;
                border-radius: 0;
                color: white;
                background-color: transparent;
            }
            #button {
                height: 50px;
                border-radius: 0;
                color: black;
                background-color: rgba(255, 255, 255, 0.5);
                border: 0;
                text-transform: uppercase;
            }
        }
    }

</style>
