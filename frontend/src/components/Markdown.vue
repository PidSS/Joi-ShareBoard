<script setup>
import { useMessage, useThemeVars } from 'naive-ui'
import {Marked} from "marked";
import DOMPurify from 'dompurify'
import {markedHighlight} from "marked-highlight";
import 'highlight.js/styles/atom-one-dark.css'
import hljs from 'highlight.js';
import ClipboardJS from 'clipboard'

const API_URL = import.meta.env.VITE_API_URL

const { primaryColor, primaryColorHover } = useThemeVars().value


const message = useMessage()

const escapeTest = /[&<>"']/;
const escapeReplace = new RegExp(escapeTest.source, 'g');
const escapeTestNoEncode = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/;
const escapeReplaceNoEncode = new RegExp(escapeTestNoEncode.source, 'g');
const escapeReplacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};
const getEscapeReplacement = (ch) => escapeReplacements[ch];
function escape(html, encode) {
    if (encode) {
        if (escapeTest.test(html))
            return html.replace(escapeReplace, getEscapeReplacement);
    } else {
        if (escapeTestNoEncode.test(html))
            return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
    }
    return html;
}

const marked = new Marked(
    markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) {
            if ( lang==='' ) {
                return hljs.highlightAuto(code).value
            } else {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value
            }
        }
    }),
    {
        renderer: {
            code(code, lang, escaped) {
                let lineNumBlock;
                if (code==='') lineNumBlock =''
                else {
                    let temp = code.match(/\n|\r|\r\n/g)
                    const lineCnt = temp ? temp.length+1 : 1
                    lineNumBlock = `<pre class="linenum">${[...Array(lineCnt).keys()].map(i => i + 1).join('\n')}</pre>`
                }
                let temp = hljs.getLanguage(lang)
                const language = temp ? temp.name : ''
                return `<div class="codecontainer">
                    <div class="headtool">
                        <div>${escape(language)}</div>
                        <button>Copy Code</button>
                    </div>
                    <pre class="codeblock">
                        ${lineNumBlock}
                        <code class="hljs language-${escape(lang)}">${escaped ? code : escape(code)}</code>
                    </pre>
                </div>
                `;
            },
            link(href, title, text) {
                console.log({href, title, text})
                const title_attr = title ? `title="${title}"` : ""
                if (href.startsWith(`${API_URL}/download?filename=`)) {
                    return `<a href="${href}" ${title_attr} class="downloadBtn">
                        <svg t="1724660753949" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4259" width="64" height="64"><path d="M842.24 312.746667l-189.44-213.333334a42.666667 42.666667 0 0 0-31.573333-14.08h-341.333334A107.946667 107.946667 0 0 0 170.666667 192v640A107.946667 107.946667 0 0 0 279.893333 938.666667h464.213334A107.946667 107.946667 0 0 0 853.333333 832V341.333333a42.666667 42.666667 0 0 0-11.093333-28.586666zM597.333333 170.666667l159.573334 170.666666h-128a33.706667 33.706667 0 0 1-31.573334-36.266666z" p-id="4260" fill="currentColor"></path></svg>
                        <span>${text}</span>
                    </a>`
                }
                return `<a href="${href}" ${title_attr}>${text}</a>`
            }
        }
    }
);

function mark(str) {
    return DOMPurify.sanitize(marked.parse( str ));
}

const randomID = Math.random().toString()
const cb = new ClipboardJS(`.Markdown[data-random-id="${randomID}"] > .codecontainer > .headtool > button`,{
    text: trigger => trigger.parentNode.parentNode.lastElementChild.lastElementChild.innerText
})
cb.on('success', ()=>{
    message.success("复制成功")
})
cb.on('error', e=>{
    console.error(e)
    message.error("复制失败")
})
</script>

<script>
export default {
    data() {
        return {
        }
    },
    props: {
        value: String
    },
    methods: {
    },
    mounted() {
    }
}
</script>

<template>
    <div class="Markdown container"
        v-html="mark(value)"
        :data-random-id="randomID"
    ></div>
</template>

<style lang="sass">
@use '../assets/main'
.codecontainer
    margin: 1em
    border-radius: calc( var(--n-border-radius) * 2 )
    overflow: hidden
    background-color: #22252a
    .headtool
        width: 100%
        height: 26px
        display: flex
        flex-flow: row nowrap
        align-items: center
        justify-content: space-between
        box-sizing: border-box
        padding: 0 12px
        font:
            size: 12px
            weight: bold
        color: white
        div
            opacity: 0.4
            user-select: none
        button
            opacity: 0.4
            color: inherit
            font: inherit
            padding: 0
            transition: opacity 0.15s
            border: none
            background: none
            border-radius: 4px
            cursor: pointer
            &:hover
                opacity: 0.6
    .codeblock
        display: flex
        flex-flow: row nowrap
        margin: 0
        font:
            family: CascadiaCoded, monospace
            size: 14px
        border-radius: calc( var(--n-border-radius) * 2 )
        overflow: hidden
        .linenum
            background-color: #282c34
            height: 100%
            margin: 0
            padding:
                top: 1.2rem
                bottom: 1.2rem
                left: 1rem
                right: 0.5rem
            text-align: right
            color: rgba(#acb2be77, 0.5)
            user-select: none
            font: inherit
        code.hljs
            font: inherit
            width: 100%
            padding:
                top: 1.2rem
                bottom: 1.2rem

.Markdown
    a
        text-underline-offset: 0.2em
        color: v-bind(primaryColor)
        &:hover
            color: v-bind(primaryColorHover)
    code:not(.hljs)
        color: rgb(235, 87, 87)
        background-color: rgba(135, 131, 120, 0.15)
        padding: 0.2em 0.4em
        margin: 0 0.1em
        border-radius: 4px
    blockquote
        color: rgba(255, 255, 255, 0.5)
        &::after
            content: ''
            position: absolute
            top: 0
            left: -1em
            bottom: 0
            width: 3px
            background-color: rgba(255, 255, 255, 0.3)
    table
        border-collapse: collapse
        th, td
            border: solid rgba(255, 255, 255, 0.5) 1px
            padding: 0.2em 0.75em
    .downloadBtn
        background-color: transparent
        border: none
        cursor: pointer
        text-decoration: none
        color: var(--n-text-color)
        font-weight: bold
        align-items: center
        padding: 0.2em 0.1em 0.2em 0
        margin: 0 0.1em
        border-radius: 4px
        svg
            width: 1.2em
            height: 1.2em
            padding-bottom: 0.1em
            vertical-align: middle
        span
            text-decoration: underline
            text-decoration-color: rgba(255, 255, 255, 0.3)
            text-underline-offset: 0.2em
        &:hover
            color: var(--n-text-color)
            background-color: rgba(135, 131, 120, 0.15)
</style>