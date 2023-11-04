<script setup>
import ScrollerFlexMax from './ScrollerFlexMax.vue'
import { useThemeVars, NElement } from 'naive-ui'
</script>

<script>
import { readTextFile } from '../assets/readText'

function codebolckQuoteLen(text) {
    const regex = /^`+/gm;
    let maxLength = 0;
    let matches;
    while ((matches = regex.exec(text)) !== null) {
        if (matches[0].length > maxLength) {
            maxLength = matches[0].length;
        }
    }
    return Math.max(maxLength+1, 3)
}

function mdCodeQuote(code, options){
    let backticks = "`".repeat(codebolckQuoteLen(code))
    let titleLine = options.title ? `### ${options.title}` : ``
    return `${titleLine}\n${backticks}${options.lang ?? ''}\n${code}\n${backticks}\n\n`
}

export default {
    methods: {
        focusEditarea() {
            this.$refs.editarea.focus()
        },
        getValue() {
            return this.$refs.editarea.innerText;
        },
        setValue(val) {
            this.$refs.editarea.innerText = val
        },
        async handlePaste(ev) {
            // 截断默认粘贴事件 将内容转为纯文本
            let usable_types = ev.clipboardData.types.join('\n');
            if (/text\/.*/.test(usable_types)) {
                //可以直接提取为文本
                let text = ev.clipboardData.getData("text")
                this.pasteText(text)
            } else if (/Files/.test(usable_types)) {
                await this.pasteFiles(ev.clipboardData.files)
            }
        },
        async pasteFiles(files) {
            for (let file of files) {
                // 匹配文本类型，用于标注
                let regres = file.type.match(/(?<=^text\/).*$|json$|php$|ipynb$/)
                let lang = regres ? regres[0] : undefined
                // 读取文本内容
                try {
                    let text = await readTextFile(file)
                    text = mdCodeQuote(text, { lang, title:file.name })
                    this.pasteText(text)
                } catch(err) {
                    continue
                }
            }
        },
        pasteText(text) {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            selection.deleteFromDocument();
            selection.getRangeAt(0).insertNode(document.createTextNode(text));
            selection.collapseToEnd();
        }
    },
    expose: ['getValue', 'setValue', 'pasteFiles', 'focusEditarea']
}
</script>

<template>
    <n-element class="TextInputBox container"
        @click="focusEditarea()"
    >
        <ScrollerFlexMax>
            <n-element class="content">
                <pre ref="editarea"
                    class="editarea"
                    contenteditable
                    @paste.prevent="handlePaste"
                ></pre>
            </n-element>
        </ScrollerFlexMax>
    </n-element>
</template>

<style lang="sass" scoped>
.TextInputBox.container
    flex: 1
    display: flex
    flex-flow: column nowrap
    overflow: hidden
    background-color: var(--n-color)
    border-radius: var(--n-border-radius)
    padding:
        top: 10px
        bottom: 10px
        left: 10px
        right: 0
    background-color: rgba(white, 0.04)
    outline-offset: -1px
    outline: 1.5px solid transparent
    transition: outline-color 0.3s var(--n-bezier), background-color 0.3s var(--n-bezier)
    &:hover, &:focus-within
        outline: 1.5px solid var(--primary-color-hover)
    &:focus-within
        background-color: rgba(99, 226, 183, 0.1)
.editarea
    padding-right: 6px
    margin: 0
    &:focus
        outline: none
</style>