<script setup>
import { useThemeVars } from 'naive-ui'
import { setTransitionHooks } from 'vue'
const { scrollbarColor, scrollbarColorHover } = useThemeVars().value
</script>

<script>
// 定义拖拽控制器
// class DragOffsetRegister {
//     activeBase = undefined
//     passiveBase = undefined
//     valid = false
//     setOffsetBase(activeValue, passiveValue) {
//         this.valid = true
//         this.activeBase = activeValue
//         this.passiveBase = passiveValue
//     }
//     getOffset(activeValue) {
//         return (activeValue - this.activeBase) + this.passiveBase
//     }
//     isValid() {
//         return this.valid
//     }
//     reset() {
//         this.valid = false
//     }
// }
// let dor = new DragOffsetRegister();
import Drago from '../assets/dragOffsetter'
let heightRegister = 0;

export default {
    data() {
        return {
            scroller: undefined,
            scrollTop: undefined,
            scrollHeight: undefined,
            clientHeight: undefined,
            scrollbarFadeTimeout: 0,
            scrollbarKeepVisible: false,
            scrollContent: undefined
        }
    },
    methods: {
        handleScrollEvent() {
            const { scrollTop, scrollHeight,clientHeight } = this.scroller
            this.scrollTop = scrollTop
            this.scrollHeight = scrollHeight
            this.clientHeight = clientHeight
            this.showScrollbar()
        },
        showScrollbar() {
            clearTimeout(this.scrollbarFadeTimeout);
            this.scrollbarFadeTimeout = setTimeout(()=>{
                this.scrollbarFadeTimeout = 0;
            }, 2500);
        },
        handleScrollMouseEnter() {
            this.scrollbarKeepVisible = true
        },
        handleSCrollMouseLeave() {
            this.scrollbarKeepVisible = false
            this.showScrollbar()
        },
        handleScrollMouseDown(ev) {
            const drago = new Drago(ev.y, this.scrollTop, this.scrollHeight/this.clientHeight)
            document.onmousemove = (e)=>{
                this.scroller.scrollTop = drago.passivePos(e.y)
            }
            document.onmouseup = (e)=>{
                document.onmousemove = null
                document.onmouseup = null
            }
        }
    },
    computed: {
        scrollbarHeight() {
            return this.clientHeight * this.clientHeight / this.scrollHeight;
        },
        scrollbarTop() {
            return this.scrollTop * this.clientHeight / this.scrollHeight;
        },
        scrollbarVisible() {
            return (this.scrollHeight !== this.clientHeight) &&
                (this.scrollbarFadeTimeout || this.scrollbarKeepVisible)
        }
    },
    mounted() {
        // 监听内容高度变化
        this.scroller = this.$refs.scrollContent
        heightRegister = this.scroller.scrollHeight
        const scrollContent = this.$refs.scrollContent
        const observer = new MutationObserver(() => {
            if(this.scroller.scrollHeight===heightRegister) return
            else {
                heightRegister = this.scroller.scrollHeight
                this.handleScrollEvent();
            }
        });
        const config = { childList: true, subtree: true };
        observer.observe(scrollContent, config);
    }
}
</script>

<template>
    <div class="ScrollerFlexMax container"
    >
        <div class="content"
            @scroll="handleScrollEvent()"
            ref="scrollContent"
        >
            <slot></slot>
        </div>

        <!-- 滚动条 -->
        <div class="scrollbar-container"
            @mouseenter="handleScrollMouseEnter()"
            @mouseleave="handleSCrollMouseLeave()"
        >
            <Transition name="fade">
                <div class="scrollbar"
                    v-show="scrollbarVisible"
                    :style="{ 'height': `${scrollbarHeight}px`, 'top': `${scrollbarTop}px` }"
                    @mousedown.prevent="handleScrollMouseDown($event)"
                ></div>
            </Transition> 
        </div>
    </div>
</template>

<style lang="sass" scoped>
@use '../assets/main'
.ScrollerFlexMax.container, .content
    flex: 1
    display: flex
    flex-flow: column nowrap
.container
    overflow: hidden
.content
    overflow: scroll
.container, .content
    @include main.hideScrollBar
    
.scrollbar-container
    position: absolute
    right: 0
    top: 0
    bottom: 0
    height: 100%
    width: 10px
    transition: width 0.15s
    &:hover
        width: 12px
    .scrollbar
        position: absolute
        right: 4px
        left: 0
        background-color: v-bind(scrollbarColor)
        &:hover
            background-color: v-bind(scrollbarColorHover)
        border-radius: 10px
        transition: background-color 0.15s

.fade-enter-active.scrollbar
    animation: fade-in 0.12s
    @keyframes fade-in
        from
            opacity: 0
        to
            opacity: 1

.fade-leave-active.scrollbar
    animation: fade-out 0.5s
    @keyframes fade-out
        from
            opacity: 1
        to
            opacity: 0
</style>