<script setup>
import TextInputBox from './TextInputBox.vue'
import Markdown from './Markdown.vue'
import ScrollerFlexMaxVue from './ScrollerFlexMax.vue'
import { useThemeVars, NCard, NIcon, NButton, NSpace, useMessage, NAvatar, NTooltip, NPopconfirm, NText } from 'naive-ui'
import axios from 'axios'
import { mapWritableState } from 'pinia'
import { useUserInfoStore } from '@/store/UserInfo.js'
import { PaperPlane } from '@vicons/fa'
const { primaryColor, primaryColorHover, primaryColorPressed, baseColor } = useThemeVars().value
import { Add12Filled, Warning24Filled } from '@vicons/fluent'
import { Clipboard, Edit } from '@vicons/tabler'
import { DeleteFilled } from '@vicons/material'
import ClipboardJS from 'clipboard'

const props = defineProps({
    preAdd: {
        type: Boolean,
        default: false
    },
    boardInfo: {
        required: true
    },
    spaceId: {
        required: true
    },
    filterPattern: {
        type: String,
        required: false
    }
})

window.$message = useMessage()
</script>

<script>
import Drago from '../assets/dragOffsetter'
import { nextTick } from 'vue'
const API_URL = import.meta.env.VITE_API_URL

export default {
    data() {
        return {
            dropAreaVisible: false,
            boardWidth: 420,
            posterInfo: undefined,
            modifyingContent: false,
            content: '',
            randomID: Math.random().toString()
        }
    },
    computed: {
        ...mapWritableState(useUserInfoStore, ['userinfo']),
        prePost() {
            return (this.boardInfo.bid===null || this.boardInfo.bid===undefined)
        },
        show() {
            let pattern = this.filterPattern
            if (pattern==='')
                return true
            if (this.preAdd || this.prePost || this.modifyingContent)
                return true
            if (this.posterInfo===undefined)
                return true
            if (pattern.toLowerCase().startsWith('user:'))
                return [
                    this.posterInfo.uid.toString(),
                    this.posterInfo.name.toLowerCase()
                ].includes( pattern.slice(5).toLowerCase() ) // 匹配用户名或uid，忽略大小写，但没有模糊匹配
            return this.content.includes(pattern) // 普通子串匹配
            /**@todo 正则匹配 */
        }
    },

    methods: {
        handleEditSubmit() {
            if (this.userinfo.uid===undefined){
                window.$message.warning("申必人！请先登陆到Joi")
                return
            }
            const content = this.$refs.TextBox.getValue()
            if (!this.modifyingContent) {
                let data = {
                    uid: this.userinfo.uid,
                    content
                }
                axios.post(`${API_URL}/postBoard/${this.spaceId}`, data)
                    .then( res => {
                        this.content = content
                        this.boardInfo.bid = res.data.bid
                        this.boardInfo.created_at = res.data.created_at
                        this.boardInfo.updated_at = res.data.updated_at
                        this.boardInfo.poster_uid = this.userinfo.uid
                        this.fetchPosterInfo()
                    })
            }
            else {
                console.log("1")
                let data = {
                    bid: this.boardInfo.bid,
                    content
                }
                axios.post(`${API_URL}/updateBoard/${this.spaceId}`, data)
                    .then( res => {
                        console.log(2)
                        this.content = content
                        this.modifyingContent = false
                        this.boardInfo.updated_at = res.data.updated_at
                        console.log(this.boardInfo, this.modifyingContent)
                    })
            }

        },

        async handleDrop(ev) {
            this.hideDropArea()
            const TextBox = this.$refs.TextBox
            TextBox.focusEditarea()
            await TextBox.pasteFiles( ev.dataTransfer.files )
        },

        async handleChangeToEditBtnClick() {
            this.modifyingContent=true
            await nextTick()
            this.$refs.TextBox.setValue(this.content)
        },

        showDropArea() {
            this.dropAreaVisible = true
        },

        hideDropArea() {
            this.dropAreaVisible = false
        },

        resizeBoard(ev) {
            const drago = new Drago(ev.x, this.boardWidth)
            document.onmousemove = (e)=>{
                this.boardWidth = drago.passivePos(e.x)
            }
            document.onmouseup = (e)=>{
                document.onmousemove = null
                document.onmouseup = null
            }
        },

        fetchPosterInfo() {
            if (this.boardInfo.poster_uid===undefined) return
            axios.get(`${API_URL}/userinfo/${this.boardInfo.poster_uid}`)
                .then( res => {
                    this.posterInfo = res.data
                })
        },
        
        fetchContent() {
            const { bid } = this.boardInfo
            if (!bid) return
            axios.get(`${API_URL}/getBoardContent/${this.spaceId}`, { params: { bid }})
                .then( res => {
                    this.content = res.data.content
                })
        },

        // filterBy(pattern) {
        //     let shouldShow = ()=>{
        //         if (pattern==='')
        //             return true
        //         if (this.preAdd || this.prePost || this.modifyingContent)
        //             return true
        //         return this.content.includes(pattern)
        //     }
        //     this.show = shouldShow()
        // }
    },

    created() {
        this.fetchContent()
        this.fetchPosterInfo()
    },

    mounted() {
        const cb = new ClipboardJS(`.n-button[data-random-id="${this.randomID}"]`,{
            text: trigger => this.content // 需要改！！！
        })
        cb.on('success', ()=>{
            window.$message.success("复制成功")
        })
        cb.on('error', e=>{
            console.error(e)
            window.$message.error("复制失败")
        })
    },

    expose: ['handleDrop', 'filterBy']
}
</script>

<template>
    <div v-show="show" class="BoardItem" :style="{ 'width': `${boardWidth}px`}">
        <Transition name="bounce">

            <!-- 待添加状态（左侧绿色） -->
            <div v-if="preAdd" class="preAdd"
            :key="1"
                @click="$emit('newBoard')"
            >
                <n-icon :component="Add12Filled" size="3rem" :color="baseColor" />
            </div>

            <template v-else>

                <!-- 编辑状态 -->
                <n-card v-if="prePost || modifyingContent"
                    class="Edit border-shine"
                    :class="{ droppable: dropAreaVisible, fromDisplay: modifyingContent }"
                    title="编辑内容"
                    @keydown.meta.enter.exact="handleEditSubmit"
                    @keydown.ctrl.enter.exact="handleEditSubmit"
                    @dragover.prevent.stop="showDropArea()"
                    @dragleave.prevent.stop="hideDropArea()"
                    @deagend.prevent.stop="hideDropArea()"
                    @drop.prevent.stop="handleDrop"
                >
                    <TextInputBox ref="TextBox" />
                    <template #footer>
                        <n-button type="primary"
                            @click="handleEditSubmit"
                        >
                            <template #icon>
                                <n-icon :component="PaperPlane" />
                            </template>
                            {{ modifyingContent ? "修改" : "贴上去"}}
                        </n-button>
                    </template>
                </n-card>

                <!-- 展示状态 -->
                <n-card v-else
                    class="Display"
                    title=" "
                    :segmented="{
                        content: 'soft'
                    }"
                    size="small"
                >
                    <!-- 卡片顶部 -->
                    <template #header-extra>
                        <n-button v-if="posterInfo!==undefined"
                            text
                        >
                            <template #icon>
                                <n-avatar v-if="!posterInfo.avatar_path"
                                    round
                                    bordered
                                    :style="{
                                        'height': 'var(--n-icon-size)',
                                        'border': 'none',
                                        'outline': '1px solid var(--n-text-color)'
                                    }"
                                >
                                    {{ posterInfo.name[0] }}
                                </n-avatar>
                                <n-avatar v-else :src="`${API_URL}/${posterInfo.avatar_path}`"
                                    round
                                    bordered
                                    :style="{
                                        'height': 'var(--n-icon-size)',
                                        'border': 'none',
                                        'outline': '1px solid var(--n-text-color)'
                                    }"
                                />
                            </template>
                            {{ posterInfo.name }}
                        </n-button>
                        <n-space align="center" :wrap-item="false">
                            <!-- 删除 -->
                            <n-popconfirm
                                @positive-click="$emit('deleteBoard')"
                                negative-text="取消"
                                positive-text="删除"
                                :positive-button-props="{ type: 'error' }"
                            >
                                真的要把我删掉吗？
                                <template #icon>
                                    <n-icon :component="Warning24Filled" color="#da8583"></n-icon>
                                </template>
                                <template #trigger>
                                    <n-tooltip trigger="hover">
                                        <template #trigger>
                                            <n-button text>
                                                <n-icon :component="DeleteFilled" size="18px" />
                                            </n-button>
                                        </template>
                                        删除
                                    </n-tooltip>
                                </template>
                            </n-popconfirm>
                            <!-- 编辑 -->
                            <n-tooltip trigger="hover">
                                <template #trigger>
                                    <n-button text @click="handleChangeToEditBtnClick">
                                        <n-icon :component="Edit" size="18px" />
                                    </n-button>
                                </template>
                                编辑
                            </n-tooltip>
                            <!-- 复制全部 -->
                            <n-tooltip trigger="hover">
                                <template #trigger>
                                    <n-button text :data-random-id="randomID">
                                        <n-icon :component="Clipboard" size="18px" />
                                    </n-button>
                                </template>
                                复制全部
                            </n-tooltip>
                        </n-space>
                    </template>

                    <!-- 卡片内容 -->
                    <ScrollerFlexMaxVue style="flex: 1">
                        <Markdown :value="content" />
                        <n-space justify="space-between" style="margin-top: auto;">
                            <n-text depth="3">发布于：{{ boardInfo.created_at }}</n-text>
                            <n-text depth="3" v-if="boardInfo.updated_at!==null">修改于：{{ boardInfo.updated_at }}</n-text>
                        </n-space>
                    </ScrollerFlexMaxVue>
                </n-card>

            </template>

        </Transition>

        <!-- 宽度调节条 -->
        <div v-if="!preAdd"
            class="dynamicBarContainer"
            @mousedown.prevent="resizeBoard"
        >
            <div class="dynamicBar"></div>
        </div>
    </div>
</template>

<style lang="sass" scoped>
$primary: v-bind(primaryColor)
@use "../assets/main"
.BoardItem
    min-width: 15rem
    max-width: 70vw
    height: 100%
    > *
        @include main.hideScrollBar
        position: absolute
        translate: 0 -50%
        top: 50%
        max-height: 100%
    > .Display
        overflow: scroll

.n-card, .preAdd
    min-height: 25rem
    width: 100%
    border-radius: 6px

.n-card
    box-sizing: border-box
    border-width: 1.5px

.preAdd
    transition: all 0.3s
    background-color: $primary
    scale: 0.7
    cursor: pointer
    .n-icon
        translate: 0 -50%
        position: absolute
        right: 2.3rem
        top: 50%
    &:hover
        background-color: v-bind(primaryColorHover)
    &:active
        background-color: v-bind(primaryColorPressed)
    &:hover, &:active, .activating
        translate: 2rem -50%

.Edit
    .n-input--textarea
        height: 100%
    .n-button
        float: right
    transition: border-color 0.3s
    &::after
        content: ''
        @include main.absolute-full
        transition: background-color 0.3s
        opacity: 0.2
        pointer-events: none
    &.droppable
        border-color: $primary
        &::after
           background-color: $primary

.dynamicBarContainer
        transition: 0 50%
        left: 100%
        width: 1rem
        top: 50%
        height: 100%
        max-height: 5rem
        .dynamicBar
            left: 0
            top: 0
            height: 100%
            width: 5px
            background-color: v-bind(primaryColor)
            border-top-right-radius: 1rem
            border-bottom-right-radius: 1rem
        opacity: 0
        transition: opacity 0.3s, max-height 0.1s 1s ease-out
        cursor: col-resize
        &:hover
            opacity: 1
            max-height: 8rem
            transition: max-height 0.1s

.n-text
    opacity: 0.6
    font-size: 12px

*:hover~.dynamicBarContainer
    opacity: 0.3
    transition: max-height 0.1s

.border-shine
    animation: border-shine 2s ease-out
    @keyframes border-shine
        0%, 30%
            border-color: $primary
        100%
            border-color: var(--n-border-color)

.bounce-enter-active.Edit
    animation: bounce-in 0.5s
    @keyframes bounce-in
        0%
            scale: 0.7
            translate: 2rem -50%
            opacity: 0
            border-color: $primary
        65%
            scale: 0.55
            translate: 1rem -50%
            opacity: 0
        80%
            scale: 1.05
        100%
            scale: 1
            translate: 0 -50%
            opacity: 1
            border-color: $primary

.bounce-leave-active.preAdd
    animation: bounce-out 0.5s
    @keyframes bounce-out
        0%
            scale: 0.7
            translate: 2rem -50%
            opacity: 1
        65%
            scale: 0.55
            translate: 1rem -50%
            opacity: 1
        80%
            scale: 1.05
        100%
            scale: 1
            translate: 0 -50%
            opacity: 1
    &~.dynamicBarContainer
        opacity: 0

.bounce-leave-active.Edit
    animation: shrink 0.25s
    @keyframes shrink
        0%
            scale: 100%
            opacity: 1
        20%
            scale: 70%
            opacity: 0
        100%
            scale: 70%
            opacity: 0
.bounce-leave-to
    opacity: 0
    
.bounce-enter-active.Display
    animation: boom 0.25s
    @keyframes boom
        0%
            scale: 100%
        20%
            scale: 100%
        45%
            scale: 103%
        100%
            scale: 100%

.bounce-enter-active.Edit.fromDisplay
    animation: boom 0.25s
    @keyframes boom
        0%
            scale: 100%
        20%
            scale: 100%
        45%
            scale: 103%
        100%
            scale: 100%
</style>

<style lang="sass">
.n-card__content:has(.TextInputBox, .ScrollerFlexMax)
    display: flex
    flex-flow: column nowrap
    overflow: hidden
.Display.n-card > .n-card-header
    .n-card-header__main
        flex: 0
    .n-card-header__extra
        flex: 1
        justify-content: space-between
        > *:last-child
            margin-left: auto
</style>