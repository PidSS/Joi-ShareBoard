<script setup>
import { useMessage } from 'naive-ui'

const message = useMessage()

import DOMPurify from 'dompurify'
import {Marked} from "marked";
import {markedHighlight} from "marked-highlight";
import 'highlight.js/styles/atom-one-dark.css'
import hljs from 'highlight.js';

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
            }
        }
    }
);

function mark(str) {
    return DOMPurify.sanitize(marked.parse( str ));
}

import ClipboardJS from 'clipboard'
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
</style>