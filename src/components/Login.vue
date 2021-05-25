<template>
    <div>
        <AuthingGuard :appId="'60ace8a7de8081b582bbaf6e'" @login="login"></AuthingGuard>
    </div>
</template>

<script>
    import { AuthingGuard,getAuthClient } from '@authing/vue-ui-components'
import '@authing/vue-ui-components/lib/index.min.css'

    export default {
        components:{
            AuthingGuard
        },
        methods:{
            login(userinfo){
                console.log(userinfo);
                this.$router.push({
                    path:"/"
                })
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>