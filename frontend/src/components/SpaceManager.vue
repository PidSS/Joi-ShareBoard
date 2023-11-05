<script setup>
import { ref, onBeforeMount, computed, watch, h, onMounted } from 'vue'
import { NModal, NButton, NInput, NPopover, NSpace, NCollapseTransition, NSwitch, NText, NH6,  NIcon, NTooltip, NDynamicTags, NTag, NMention, NAvatar, useMessage, NPopconfirm } from 'naive-ui'
import axios from 'axios'
import { useUserInfoStore } from '@/store/UserInfo.js'
import { HelpRound } from '@vicons/material'
import { Add12Filled, Warning24Filled } from '@vicons/fluent'

const API_URL = import.meta.env.VITE_API_URL

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    },
    spaceInfo: {
        type: Object,
        required: false
    },
    creating: {
        type: Boolean,
        required: false
    }
})
const emit = defineEmits(['update:show', 'addSpace', 'modifySpace', 'deleteSpace'])
const showModal = computed({
    get() {
        return props.show
    },
    set(newVal) {
        emit('update:show', newVal)
    }
})

const { userinfo } = useUserInfoStore()

// 根据是否提供了头像链接来显示头像或首字母的小「组件」
function dynamicAvatar(avatar_path, name, size) {
    return h(
        NAvatar, {
            round: true,
            bordered: true,
            style: {
                // height: 'var(--n-icon-size)',
                border: 'none',
                outline: '1px solid var(--n-text-color)'
            },
            size,
            src: avatar_path ? `${API_URL}/${avatar_path}` : undefined
        }, {
            default: ()=>{
                if (!avatar_path) return name[0]
            }
        }
    )
}

const inputValue = ref('')
/// dynamic tags
const publicness = ref(false) // 空间是否是公开的
const tags = ref([]) // 成员标签输入的值

watch(props, (newProps, oldProps)=>{ // 监听props状态，判断是修改空间还是新建空间，同时更新相应值
    if (newProps.show===false)
        return // 仅处理从不展示切换到展示的情况
    // 初始化tags
    tags.value = [{
        label: userinfo.name ?? ' ',
        value: userinfo.uid,
        avatar_path: userinfo.avatar_path
    }]
    if (newProps.spaceInfo.members!==null) {
        // 将members都放进来
        const available = new Set(newProps.spaceInfo.members.filter(x=>x!==newProps.spaceInfo.owner))
        for (let item of userList.value.filter(x=>available.has(x.uid))) {
            tags.value.push({
                label: item.name,
                value: item.uid,
                avatar_path: item.avatar_path
            })
        }
    }
    // 初始化input
    inputValue.value = newProps.creating ? '' : newProps.spaceInfo.name
    // 初始化switch
    if (newProps.creating===false && newProps.spaceInfo.members===null)
        publicness.value = true
    else publicness.value = false
})
// 自定义tag渲染
function renderTag(tag, index) {
    return h(
        NTag, {
            closable: index>0,
            size: 'large',
            type: index ? 'info' : 'default',
            round: true,
            bordered: index===0,
            onClose: () => {
              tags.value.splice(index, 1)
            }
        }, {
            default: () => tag.label,
            avatar: () => dynamicAvatar(tag.avatar_path, tag.label)
        }
    )
}
const memberUidList = computed( () => tags.value.map(item => item.value) )


/// mention
// 获取全部用户的信息 用以在Mention中使用提示
const userList = ref([])
const userListLoaded = ref(false)
onBeforeMount(()=>{
    axios.get(`${API_URL}/allUserInfo`).then( res => {
        userList.value = res.data
    }).finally(()=>{
        userListLoaded.value = true
    })
})
const mentionOptions = computed(()=>{
    // 去掉已经被选上的元素
    const existed = new Set(tags.value.map(x=>x.value))
    console.log(existed)
    return userList.value.filter(x=>!existed.has(x.uid)).map( item => ({
        label: item.name,
        value: item.uid,
        avatar_path: item.avatar_path
    }))
})
function renderLabels(option) {
    return h("div", { style: "display: flex; align-items: center; padding-left: 2px; gap: 8px" }, [
        dynamicAvatar(option.avatar_path, option.label, 18),
        option.label
    ])
}
const mentionRef = ref(null)
const vFocus = {
    mounted: () => {
        mentionRef.value.focus()
    }
}

const message = useMessage()

function handleSubmitCreate() {
    let name = inputValue.value
    let owner = userinfo.uid
    let members = publicness.value ? null : memberUidList.value
    console.log(members, publicness.value, memberUidList.value)
    if (name==='') {
        message.warning("根据最新指示，空间不得没有名字")
        return
    }
    if (name[0]==="'") {
        message.warning("空间名你都要渗透测试啊？")
        return
    }
    if (owner===undefined || owner===null) {
        message.warning("发生未知错误")
        return
    }
    const data = { name, owner, members }
    axios.post(`${API_URL}/createSpace`, data)
        .then( res => {
            message.success("创建成功")
            emit('addSpace', res.data)
            showModal.value=false
        })
        .catch( err => {
            console.error(err)
            message.warning("发生错误")
        })
}

function handleSubmitModify() {
    let name = inputValue.value
    let sid = props.spaceInfo.sid
    let members = publicness.value ? null : memberUidList.value
    if (name==='') {
        message.warning("根据最新指示，空间不得没有名字")
        return
    }
    if (name[0]==="'") {
        message.warning("空间名你都要渗透测试啊？")
        return
    }
    const data = { name, members }
    axios.post(`${API_URL}/modifySpace/${sid}`, data)
        .then( res => {
            message.success("修改成功")
            emit('modifySpace', {
                sid, name, members, owner:userinfo.uid
            })
            showModal.value=false
        })
        .catch( err => {
            console.error(err)
            message.warning("发生错误")
        })
}

function handleDeleteSpace() {
    let sid = props.spaceInfo.sid
    axios.get(`${API_URL}/deleteSpace/${sid}`)
        .then( () => {
            message.success("$ world.excute(me) && echo \"删除成功\"")
            emit('deleteSpace', sid)
            showModal.value=false
        })
        .catch( err => {
            console.error(err)
            message.warning("发生错误")
        })
}

</script>

<template>
    <n-modal
        :show="showModal"
        preset="card"
        :title="creating ? '新建空间' : '更改空间设置'"
        size="huge"
        :closable="false"
        :segmented="{
            content: 'soft',
            footer: 'soft'
        }"
        style="width: 30rem"
    >

        <n-input
            v-model:value="inputValue"
            placeholder="空间名 - 你可以把名字起得很长，但太长了很丑"
            size="large"
        />

        <n-space align="center" :wrap-item="false">
            <n-switch v-model:value="publicness" />
            <n-h6 strong style="margin: 0">
                {{ publicness ? "公共空间" : "私有空间"}}
                <n-tooltip trigger="click">
                    <template #trigger>
                        <n-button text depth="3">
                            <n-icon size="12px"><HelpRound /></n-icon>
                        </n-button>
                    </template>
                    <b>对于公共空间：</b><br>所有人可见、可发布、可删除剪贴板，<br>创建者可销毁空间（除Main外）<br><br>
                    <b>对于私有空间：</b><br>创建者和指定的用户可见、可发布、可删除剪贴板，<br>创建者可销毁空间并更改可见成员<br><br>
                    Joi的鉴权是君子协议喵，不要在私有空间放一些奇怪的东西喵！
                </n-tooltip>
            </n-h6>
        </n-space>

        <n-collapse-transition :show="!publicness">
            <n-space vertical size="large">
                <n-h6 style="margin: 8px 0" strong>空间成员 ({{ memberUidList.length }})</n-h6>
                <n-dynamic-tags
                    size="large"
                    v-model:value="tags"
                    :render-tag="renderTag"
                >
                    <template #input="{ submit, deactivate }">
                        <n-mention
                            ref="mentionRef"
                            default-value="@"
                            v-focus
                            :render-label="renderLabels"
                            :options="mentionOptions"
                            :loading="!userListLoaded"
                            @select="$nextTick(()=> submit($event) )"
                            @blur="deactivate"
                        />
                    </template>
                </n-dynamic-tags>
            </n-space>
        </n-collapse-transition>


        <template #footer>
            <n-space justify="space-between" align="center">

                <n-popconfirm
                    @positive-click="handleDeleteSpace"
                    negative-text="取消"
                    positive-text="删除"
                    :positive-button-props="{ type: 'error' }"
                >
                    删了就没有了哦？
                    <template #icon>
                        <n-icon :component="Warning24Filled" color="#da8583"></n-icon>
                    </template>
                    <template #trigger>
                        <n-button v-show="!creating" text type="error">
                            删除
                        </n-button>
                    </template>
                </n-popconfirm>

                <n-space justify="flex-end">
                    <n-button @click="showModal=false" secondary>
                        取消
                    </n-button>
                    <n-popover trigger="hover" placement="bottom">
                        <template #trigger>
                            <n-button type="primary"
                                @click="creating ? handleSubmitCreate() : handleSubmitModify()"
                            >
                                {{ creating ? "创建" : "修改" }}
                            </n-button>
                        </template>
                        海的对面……是什么？
                    </n-popover>
                </n-space>

            </n-space>
        </template>
    </n-modal>
</template>

<style lang="sass" scoped>
.n-input
    margin-bottom: 1.5rem

.n-collapse-transition > .n-space
    margin-top: 2.5rem

.n-mention
    width: 7rem
</style>

<style lang="sass">
.n-dynamic-tags
    & > div:last-child .n-button
        border-radius: calc(var(--n-height) / 2)
</style>