<script setup>
import { ref } from 'vue'
import { useThemeVars, NIcon, NCard, NButton, NUpload, NUploadTrigger, NUploadFileList, NScrollbar, useMessage } from 'naive-ui'
const { primaryColor, baseColor, modalColor, borderRadius, borderColor } = useThemeVars().value
import { UploadRound, AddCircleOutlineRound } from '@vicons/material'
import { useClipboard, usePermission, useStorage } from '@vueuse/core'

const API_URL = import.meta.env.VITE_API_URL

const isExpanded = ref(false) // 控制本组件的展开状态

// 尝试从 localStorage 中提取上传过的文件的记录
const uploadFileList = useStorage('upload-file-list', [])

function handleUploadFinish({ file, event }) {
    file.thumbnailUrl = `${API_URL}/${event.target.response}`
    return file
}

function handleFilelistChange(filelist) {
    uploadFileList.value = filelist
    console.log(uploadFileList.value)
}

function handleDownload(file) {
    window.open(`${API_URL}/download?filename=${file.thumbnailUrl}`, '_self')
}

// 点击列表元素时，生成对应文件的 Markdown 代码，并复制到剪贴板
const { copy, isSupported } = useClipboard({ legacy: true })
const permissionWrite = usePermission('clipboard-write')
const canUseClipboard = isSupported && permissionWrite
const message = useMessage()
async function handleCopy(file) { // 将此函数绑定到 on-preview 事件上，实际是实现复制链接的功能
    if (canUseClipboard) {
        const markdownCode = file.type.startsWith('image/')
                             ? `![${file.name}](${file.thumbnailUrl})`
                             : `[${file.name}](${API_URL}/download?filename=${file.thumbnailUrl})`
        copy(markdownCode)
            .then(() => { message.success("Markdown 代码已复制到剪贴板") })
            .catch(() => { message.error("Markdown 代码复制失败") })
    } else {
        message.warning("当前浏览器不支持自动复制，复制失败")
    }
}
</script>

<template>
    <div class="container"
        :class="{ 'extended': isExpanded }"
        @click="()=>{ isExpanded = true }"
    >
        <n-icon v-if="!isExpanded"
            class="UploadIcon" size="34" :color="baseColor"
            :component="UploadRound"
        />
        <n-upload v-else
            abstract
            multiple
            v-model:file-list="uploadFileList"
            @update:file-list="handleFilelistChange"
            :action="`${API_URL}/uploadFile`"
            list-type="image"
            @finish="handleUploadFinish"
            show-download-button
            @download="handleDownload"
            @preview="handleCopy"
        >
            <n-card
                title="上传文件"
                size="small"
                :segmented="{ content: true }"
                content-style="padding: 0; margin: 0; flex: 1; overflow: hidden;"
                header-extra-style="flex: 2"
                header-style="flex: 0; user-select: none;"
                closable
                @close="()=>{ isExpanded = false; }"
                @click.stop
            >
                <template #header-extra>
                    <n-upload-trigger #="{ handleClick }" abstract>
                        <n-button @click="handleClick" text>
                            <n-icon
                                :component="AddCircleOutlineRound"
                                size="18"
                                style="padding-right: 3px;"
                            />
                            点击或拖拽上传
                        </n-button>
                    </n-upload-trigger>
                </template>
                <n-scrollbar
                    style="padding-inline: 14px; box-sizing: border-box;">
                    <n-upload-file-list class="UploadFileList"></n-upload-file-list>
                </n-scrollbar>
            </n-card>
        </n-upload>
    </div>
</template>

<style lang="sass" scoped>
$primary: v-bind(primaryColor)
@use "../assets/main"

.container
    transition: width 0.3s, height 0.3s, border-radius 0.3s, background-color 0.2s
    &:not(.extended)        
        width: 3rem
        height: 3rem
        border-radius: 1.5rem
        background-color: $primary
        .UploadIcon
            position: relative
            translate: -50% -50%
            left: 50%
            top: 50%
    &:is(.extended)
        width: 20rem
        height: 20rem
        border-radius: v-bind(borderRadius)
        background-color: v-bind(modalColor)
        overflow: hidden
        // box-shadow: 0 0 14px -8px $primary

.n-card
    height: 20rem
    border-width: 1.5px
    border-color: v-bind(borderColor)
    --n-title-font-size: 18px !important

.UploadFileList
    padding:
        top: 8px
        bottom: 8px
</style>