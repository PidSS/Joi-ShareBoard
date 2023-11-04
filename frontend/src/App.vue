<script setup>
//
</script>

<!-- 配置Naive UI -->
<script>
    //使用暗色主题
    import { defineComponent } from 'vue'
    import { darkTheme } from 'naive-ui'

    export default defineComponent({
        setup() {
            return {
                darkTheme,
            }
        },
    })
    //主题配置
    import { NConfigProvider, NGlobalStyle } from 'naive-ui'
    /**
     * js 文件下使用这个做类型提示
     * @type import('naive-ui').GlobalThemeOverrides
     */
    const themeOverrides = {
        Button: {
            fontWeightStrong: 'bold',
            fontWeight: 'bold'
        }
    }

    import { NMessageProvider } from 'naive-ui'
</script>

<template>
    <n-config-provider
        class="max"
        :theme="darkTheme"
        :theme-overrides="themeOverrides"
    >
    <n-message-provider placement="bottom-right">
        <router-view></router-view>
        <n-global-style />
    </n-message-provider>
    </n-config-provider>
</template>

<style lang="sass" scoped>
</style>
