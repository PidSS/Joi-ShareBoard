<script setup>
import { nextTick } from 'vue'
import BoardItem from '../components/BoardItem.vue'
import Header from '../components/Header.vue'
import { useThemeVars, NScrollbar } from 'naive-ui'
const { primaryColor } = useThemeVars().value
import axios from 'axios'
</script>

<script>
const API_URL = import.meta.env.VITE_API_URL
let localTempId = -1
const newTempItem = ()=> [ --localTempId, {bid: null} ]
function itemFactory(bd) {
    return [ bd.bid, bd ]
}
const sleep = (delay) => new Promise( resolve => setTimeout(() => {resolve()}, delay))
let keyMetaOn = false
let keyCtrlOn = false

export default {
    data() {
        let templist = [ newTempItem() ]
        for (let i of [1001,1002,1003,1004,1005,1006,1007,1008]) {
            templist.push([
                i,
                {
                    bid: i,
                    content: "# h1\n## h2\n### h3\n#### h4\n##### h5\n###### h6\n\nparagraph\n\n*italic*\n**bold**\n\n`inline code`\n```Python\ndef func(s):\n    print(s)\nprint(\"code block\")\n```\n\n> BlockQuote\n>> Nested\n\n- ul\n- ul\n\n1. li\n2. li"
                }
            ])
        }
        return {
            space_id: undefined,
            boards: [ newTempItem() ],
            dropAreaVisible: false,
            preAddElem: undefined,
            filterPattern: ''
        }
    },

    methods: {
        handleNewBoard() {
            const temp = this.preAddElem
            this.boards.unshift( newTempItem() )
            return temp
        },

        handleDeleteBoard(index, bid) {
            this.boards.splice(index, 1)
            axios.get(`${API_URL}/deleteBoard/${this.space_id}`, { params: { bid } })
        },

        // 屏蔽Chrome的默认左右滑页面前进/后退手势
        preventChromeSwipeGesture(event) {
            const { target } = event
            if (target.scrollLeft === 0) {
                // 当滑到最左侧时, 设置 scrollLeft 为 1
                target.scrollLeft = 1
            } else if (target.scrollLeft === target.scrollWidth) {
                // 当滑到最右侧时, 设置 scrollLeft 为 最大值 - 1
                target.scrollLeft = target.scrollWidth - 1
            }
        },

        async handleDrop(ev) {
            this.hideDropArea()
            const target = this.handleNewBoard()
            await nextTick()
            target.handleDrop(ev)
        },
        showDropArea() {
            this.dropAreaVisible = true
        },
        hideDropArea() {
            this.dropAreaVisible = false
        },

        handleKbdFocusSearch(ev) {
            // console.log(ev)
            if (ev.key==='Meta')
                keyMetaOn = (ev.type==='keydown')
            if (ev.key==='Contorl')
                keyMetaOn = (ev.type==='keydown')
            if (ev.key==='k' && ev.type==='keydown')
                this.$refs.header.focusSearchBar()
        },
        
        fetchBoards() {
            if (this.space_id===undefined)
                return
            axios.get(`${API_URL}/listBoards/${this.space_id}`).then( async res => {
                let deletedCount = this.boards.splice(1)
                if (deletedCount.length) await sleep(150) // 如果有被移除的元素 等待元素退场动画执行完成 sleep时间是退场动画时间
                for (let bd of res.data.reverse()) {
                    this.boards.push( itemFactory(bd) )
                }
            })
        }
    },

    watch: {
        space_id(newVal, oldVal) {
            this.fetchBoards()
        }
    },

    mounted() {
        this.$refs.XScroll.scrollTo({left: 1}) // 屏蔽Chrome的默认左右滑页面前进/后退手势 不加这一条 刚进入页面的时候左滑仍会触发手势
        window.addEventListener('keydown', (ev)=>{
            this.handleKbdFocusSearch(ev)
        })
        window.addEventListener('keyup', (ev)=>{
            this.handleKbdFocusSearch(ev)
        })
    }
}
</script>

<template>
    <div class="content max" :class="{ droppable: dropAreaVisible }">
        <Header ref="header" v-model:spaceId="space_id" @filter="(val)=>filterPattern=val"></Header>
        <n-scrollbar class="XScroll max"
            ref="XScroll"
            trigger="none"
            x-scrollable
            :size="30"
            @scroll="preventChromeSwipeGesture"
            @dragover.prevent="showDropArea()"
            @dragleave.prevent="hideDropArea()"
            @deagend.prevent="hideDropArea()"
            @drop.prevent="handleDrop"
        >
            <TransitionGroup class="XSpace hmax"
                tag="div"
                name="list"
            >
                <BoardItem v-for="([key, board], index)  in boards"
                    :ref="(el)=>{
                        if (index===0) preAddElem = el
                    }"
                    :key="key"
                    :boardInfo="board"
                    :preAdd="index===0"
                    :spaceId="space_id"
                    :filterPattern="filterPattern"
                    @newBoard="handleNewBoard"
                    @deleteBoard="handleDeleteBoard(index, board.bid)"
                />
            </TransitionGroup>
        </n-scrollbar>
    </div>
</template>

<style lang="sass" scoped>
@use '../assets/main'
.content
    box-sizing: border-box
    padding: 1rem 0
    display: flex
    flex-flow: column nowrap
    align-items: center
    &::after
        content: ''
        @include main.absolute-full
        pointer-events: none
        transition: background-color 0.3s
        opacity: 0.2
    outline: 2px solid transparent
    outline-offset: -2px
    transition: outline-color 0.3s
    &.droppable
        outline-color: v-bind(primaryColor)
        &::after
            background-color: v-bind(primaryColor)
.XScroll
    flex: 1
    .XSpace
        padding: 1rem 2rem
        margin-left: -19rem
        box-sizing: border-box
        overflow-x: scroll
        display: flex
        flex-flow: row nowrap
        align-items: center
        gap: 12px 16px
        @include main.hideScrollBar

.list-enter-active:has(.preAdd)
    animation: move-in 1.25s
    @keyframes move-in
        0%
            translate: -6rem 0
        60%
            translate: -6rem 0
        100%
            translate: 0 0

.list-enter-active:has(.Display)
    animation: show-up 0.15s
    @keyframes show-up
        from
            translate: 0 1rem
            opacity: 0
        to
            translate: 0 0
            opacity: 1

.list-leave-active
    animation: fade-up 0.15s
    @keyframes fade-up
        from
            translate: 0 0
            opacity: 1
        to
            translate: 0 -1rem
            opacity: 0

</style>

<style lang="sass">

.XScroll.n-scrollbar
    .n-scrollbar-container > .n-scrollbar-content
        height: 100%
    .n-scrollbar-rail.n-scrollbar-rail--horizontal > .n-scrollbar-rail__scrollbar
        height: 7px
</style>