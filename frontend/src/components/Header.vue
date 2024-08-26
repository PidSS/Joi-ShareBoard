<script setup>
import SpaceManager from './SpaceManager.vue'
import { NSpace, NInputGroup, NInput, NButton, NH1, NIcon, NModal, NUpload, useMessage, NAvatar, NPopover, NPopselect, NButtonGroup, NCollapseTransition } from 'naive-ui'
import { UserAvatarFilled } from '@vicons/carbon'
import { ExitToAppRound, ArrowDropDownRound } from '@vicons/material'
import { PersonEdit20Regular, Add12Filled } from '@vicons/fluent'
import { MdSettings } from '@vicons/ionicons4'
import { mapWritableState } from 'pinia'
import { useUserInfoStore } from '@/store/UserInfo.js'
import axios from 'axios'
window.$message = useMessage()
const sysIsMac = navigator.userAgent.toLowerCase().includes('mac')
</script>

<script>
const API_URL = import.meta.env.VITE_API_URL

export default {
    computed: {
        ...mapWritableState(useUserInfoStore, ['userinfo']),
        updatingAvatar() {
            return this.userinfo.uid!==undefined
        },
        tempAvatarPath() {
            return this.uploadFileList.length ? this.uploadFileList[0].url : undefined
        },
        showNameinput() {
            return !this.updatingAvatar
        },
        showImgUpload() {
            return this.updatingAvatar || !this.showLoginForm
        },
        showSwitchBtn() {
            return !this.updatingAvatar
        },
        modalTitleText() {
            if (this.updatingAvatar)
                return "修改头像"
            if (this.showLoginForm)
                return "登陆"
            else
                return "注册"
        },
        submitBtnText() {
            if (this.updatingAvatar)
                return "修改"
            if (this.showLoginForm)
                return "连接Joi"
            else
                return "注册"
        },
        submitBtnTrigger() {
            if (this.updatingAvatar)
                return this.updateAvatar
            if (this.showLoginForm)
                return this.login
            else
                return this.register
        },
        spaceSelectOptions() {
            return this.spaceList.map( item =>
                ({
                    label: item.name,
                    value: item.sid
                })
            )
        },
        spaceSelectedItem() {
            for (let item of this.spaceList) {
                if (item.sid===this.spaceSelected) return item
            }
        }
    },

    props: {
        spaceId: {
            required: true
        }
    },

    data: ()=>({
        loginModalVisible: false,
        popoverVisible: false,
        showLoginForm: true,
        usernameInput: "",
        uploadFileList: [],
        nameinputStatus: 'success',
        spaceList: [],
        spaceSelected: undefined,
        creatingSpace: true,
        showSpaceManager: false,
        searchInput: ""
    }),

    methods: {
        handleUserBtnClick() {
            if (this.userinfo.uid===undefined) { // 未登录 显示登陆模态框
                this.loginModalVisible = true
            } else { // 已登陆 显示弹出按钮
                this.popoverVisible = true
            }
        },

        register() {
            const name = this.usernameInput
            const avatar_path = this.tempAvatarPath
            if (name==='') {
                this.nameinputStatus = 'error'
                window.$message.error("没有名字？斩！")
                return
            }
            if (name[0]==="'") {
                this.nameinputStatus = 'error'
                window.$message.error("渗透测试？斩！")
                return
            }
            axios.get(`${API_URL}/createUser`, { params: { name, avatar_path }})
                .then( res => {

                    const { uid, name, avatar_path } = res.data
                    this.userinfo.uid = uid
                    this.userinfo.name = name
                    this.userinfo.avatar_path = avatar_path

                    this.loginModalVisible = false
                    window.$message.success("注册成功")
                    localStorage.setItem('name',name)
                    this.fetchSpaceList()
                })
                .catch( err => {
                    if (err.response.status===400) {
                        window.$message.error("用户名已存在")
                        this.nameinputStatus = 'error'
                    }
                    else window.$message.error("发生未知错误")
                })
        },

        login() {
            const name = this.usernameInput
            if (name==='') {
                this.nameinputStatus = 'error'
                window.$message.error("没有名字？斩！")
                return
            }
            if (name[0]==="'") {
                this.nameinputStatus = 'error'
                window.$message.error("渗透测试？斩！")
                return
            }
            axios.get(`${API_URL}/userinfo`, { params: { name }})
                .then( res=> {

                    const { uid, name, avatar_path } = res.data
                    this.userinfo.uid = uid
                    this.userinfo.name = name
                    this.userinfo.avatar_path = avatar_path

                    this.loginModalVisible = false
                    window.$message.success("登陆成功")
                    localStorage.setItem('name',name)
                    this.fetchSpaceList()
                })
                .catch( err => {
                    if (err.response.status===404) {
                        window.$message.error("用户名不正确")
                        this.nameinputStatus = 'error'
                    }
                    else window.$message.error("发生未知错误")
                })
        },

        logout() {
            this.userinfo.uid = undefined
            this.userinfo.name = undefined
            this.userinfo.avatar_path = null
            localStorage.removeItem('name')
            this.fetchSpaceList()
        },

        updateAvatar() {
            const uid = this.userinfo.uid
            const avatar_path = this.tempAvatarPath
            axios.get(`${API_URL}/updateAvatar`, { params: { uid, avatar_path }})
                .then( res=> {

                    const { uid, name, avatar_path } = res.data
                    this.userinfo.uid = uid
                    this.userinfo.name = name
                    this.userinfo.avatar_path = avatar_path

                    this.loginModalVisible = false
                    window.$message.success("头像修改成功")
                })
                .catch( err => {
                    window.$message.error("发生未知错误")
                })
        },

        setupSpaceManage(creating) {
            if (!this.userinfo.uid) {
                window.$message.warning("赛博空间不是法外之地！先登录一下吧")
                return
            }
            this.$refs.spacePopselect.setShow(false)
            this.creatingSpace = creating
            this.showSpaceManager = true
        },

        handleUploadFinish(e) {
            const { file, event } = e
            const avatarPath = event.target.response
            file.url = avatarPath
            file.thumbnailUrl = `${API_URL}/${avatarPath}`
            return file
        },

        handleNameinputEnter() {
            if (this.showLoginForm) {
                this.login()
            } else {
                this.$refs.upload.openOpenFileDialog()
            }
        },

        handleUpdateAvatarBtn() {
            this.updatingAvatar = true
            this.loginModalVisible = true
        },

        handleAddSpace(val) {
            this.spaceList.push(val)
            this.spaceSelected = val.sid
        },

        handleModifySpace(val) {
            for (let [index, item] of this.spaceList.entries()) {
                if (item.sid===val.sid) {
                    this.spaceList[index] = val
                    break
                }
            }
        },

        handleDeleteSpace(sid) {
            for (let [index, item] of this.spaceList.entries()) {
                if (item.sid===sid) {
                    this.spaceList.splice(index, 1)
                    this.spaceSelected = this.spaceSelectOptions[0].value
                    break
                }
            }
        },

        fetchSpaceList() {
            const uid = this.userinfo.uid
            let url = `${API_URL}/listSpaces`
            if (uid) url+=`/${uid}`
            axios.get(url)
                .then( res => {
                    this.spaceList = res.data
                    
                    let stored_sid
                    try {
                        stored_sid = JSON.parse(localStorage.getItem('space_id'))
                        if (typeof stored_sid !== 'number') {
                            stored_sid = null
                            localStorage.setItem('space_id', null)
                        }
                    }
                    catch { stored_sid = null }

                    if (stored_sid===null || stored_sid===undefined) {
                        this.spaceSelected = this.spaceSelectOptions[0].value
                    } else {
                        const matched = this.spaceSelectOptions.find(v => v.value===stored_sid)
                        this.spaceSelected = matched ? matched.value : this.spaceSelectOptions[0].value
                    }
                })
        },

        handleSearch() {
            this.$emit('filter', this.searchInput)
            this.$refs.searchInput.blur()
        },

        focusSearchBar(ev) {
            this.$refs.searchInput.focus()
        },

        handleKbdTriggerSearch(ev) {
            this.handleSearch()
        }
    },
    expose: ['focusSearchBar'],

    watch: {
        spaceSelected(newVal, oldVal) {
            this.$emit('update:spaceId', newVal)
        }
    },

    created() {
        const storagedName = localStorage.getItem('name')
        if (storagedName!==null) {
            axios.get(`${API_URL}/userinfo`, { params: { name: storagedName }})
            .then( res=> {

                const { uid, name, avatar_path } = res.data
                this.userinfo.uid = uid
                this.userinfo.name = name
                this.userinfo.avatar_path = avatar_path

                this.loginModalVisible = false
                localStorage.setItem('name',name)
            })
            .catch( err => {
                localStorage.removeItem('name')
            })
            .finally(() => {
                this.fetchSpaceList()
            })
        }
        else this.fetchSpaceList()
    }
}
</script>

<template>
    <n-space class="Header"
        align="center"
        justify="space-between"
        size="small"
    >

        <!-- 左：标题 -->
        <n-h1 prefix="bar">Joi <span>shareboard</span></n-h1>

        <!-- 中：搜索框 -->
        <n-input-group>
            <n-input
                v-model:value="searchInput"
                ref="searchInput"
                class="searchInput"
                placeholder="查找内容"
                size="large" 
                @keydown.enter.exact="handleKbdTriggerSearch"
                :class="[sysIsMac ? 'mac' : 'win']"
            />
            <n-button
                type="primary" size="large"
                @click="handleSearch"
            >搜索</n-button>
        </n-input-group>

        <!-- 右：登陆及空间 -->
        <n-space :size="24">
            <!-- 空间 -->
            <n-button-group class="spaceSelect" size="large">
                <n-button v-if="spaceSelectedItem ? spaceSelectedItem.owner===userinfo.uid : false"
                    class="settingBtn"
                    @click="setupSpaceManage(false)"
                    quaternary
                >
                    <template #icon>
                        <n-icon><MdSettings /></n-icon>
                    </template>
                </n-button>
                <n-popselect
                    ref="spacePopselect"
                    trigger="click"
                    v-model:value="spaceSelected"
                    :options="spaceSelectOptions"
                    scrollable
                >
                    <n-button class="spaceSelectBtn"
                        quaternary icon-placement="right">
                        <div class="textWrapper">
                            {{ spaceSelectedItem ? spaceSelectedItem.name : "加载中" }}
                        </div>
                        <template #icon>
                            <n-icon size="2rem"><ArrowDropDownRound /></n-icon>
                        </template>
                    </n-button>
                    
                    <template #action>
                        <n-button class="spaceSelectAction"
                            ghost type="primary"
                            @click="setupSpaceManage(true)"
                        >
                            <template #icon>
                                <n-icon size="1rem"><Add12Filled /></n-icon>
                            </template>
                            开辟新空间
                        </n-button>
                    </template>
                </n-popselect>
                <SpaceManager
                    v-model:show="showSpaceManager"
                    :spaceInfo="spaceSelectedItem"
                    :creating="creatingSpace"
                    @addSpace="handleAddSpace"
                    @modifySpace="handleModifySpace"
                    @deleteSpace="handleDeleteSpace"
                />
            </n-button-group>
            <!-- 登陆 -->
            <n-popover trigger="manual" :show="popoverVisible"
                @clickoutside="popoverVisible=false"
            >
                <template #trigger>
                    <!-- 主按钮 -->
                    <n-button secondary size="large"
                        @click="handleUserBtnClick"
                    >
                        <!-- 主按钮内容 -->
                        <template #icon>
                            <n-icon v-if="userinfo.uid===undefined">
                                <user-avatar-filled />
                            </n-icon>
                            <n-avatar v-else-if="!userinfo.avatar_path"
                                round
                                bordered
                                :style="{
                                    'height': 'var(--n-icon-size)',
                                    'border': 'none',
                                    'outline': '1px solid var(--n-text-color)'
                                }"
                            >
                                {{ userinfo.name[0] }}
                            </n-avatar>
                            <n-avatar v-else :src="`${API_URL}/${userinfo.avatar_path}`"
                                round
                                bordered
                                :style="{
                                    'height': 'var(--n-icon-size)',
                                    'border': 'none',
                                    'outline': '1px solid var(--n-text-color)'
                                }"
                            />
                        </template>
                        {{ userinfo.name ?? "未登录" }}
                        <!-- 登陆/注册模态框 -->
                        <n-modal
                            v-model:show="loginModalVisible"
                            class="login custom-card"
                            preset="card"
                            :title="modalTitleText"
                            :closable="false"
                            :segmented="{ footer: 'soft' }"
                            size="huge"
                            :style="{
                                'min-width': '20rem'
                            }"
                        >
                            <n-space
                                vertical
                                align="center"
                                :size="30"
                            >
                                <!-- 输入栏 -->
                                <n-input v-show="showNameinput"
                                    v-model:value="usernameInput"
                                    :status="nameinputStatus"
                                    size="large"
                                    maxlength="15"
                                    show-count
                                    placeholder="用户名"
                                    style="width: 18rem;"
                                    @keydown.enter="handleNameinputEnter"
                                    @input="nameinputStatus='success'"
                                />
                                <!-- 文件上传 -->
                                <n-collapse-transition :show="showImgUpload">
                                <n-upload
                                    ref="upload"
                                    :action="`${API_URL}/uploadAvatar`"
                                    list-type="image-card"
                                    accept="image"
                                    v-model:file-list="uploadFileList"
                                    :max="1"
                                    fullPath="abc"
                                    :should-use-thumbnail-url="()=>true"
                                    :show-preview-button="false"
                                    style="--n-border-radius: 50%;"
                                    @finish="handleUploadFinish"
                                />
                                </n-collapse-transition>
                            </n-space>

                            <!-- 模态框底部 -->
                            <template #footer>
                                <n-space justify="space-between" align="center">
                                    <n-button v-show="showSwitchBtn"
                                        text type="primary"
                                        @click="showLoginForm=!showLoginForm"
                                    >
                                        去{{ (!showLoginForm) ? "登陆" : "注册" }}
                                    </n-button>
                                    <n-button type="primary"
                                        @click="submitBtnTrigger()"
                                    >
                                        {{ submitBtnText }}
                                    </n-button>
                                </n-space>
                            </template>
                        </n-modal>
                    </n-button>
                </template>
                <!-- popover按钮组 -->
                <n-space vertical>
                    <n-button icon-placement="right" @click="handleUpdateAvatarBtn(); popoverVisible=false;">
                        修改头像
                        <template #icon>
                            <n-icon :component="PersonEdit20Regular" />
                        </template>
                    </n-button>
                    <n-button icon-placement="right" @click="logout(); popoverVisible=false;">
                        退出登录
                        <template #icon>
                            <n-icon :component="ExitToAppRound" />
                        </template>
                    </n-button>
                </n-space>
            </n-popover>
        </n-space>
        
    </n-space>
</template>

<style lang="sass" scoped>
.Header
    width: 100%
    padding: 0 1rem
    box-sizing: border-box
    .n-h1
        margin: 0
        line-height: 36px
        font-family: Geologica
        font-weight: 700
        user-select: none
        span
            font-weight: 100
            opacity: 60%

    .spaceSelect
        .settingBtn
            padding: 0 6px
            i
                scale: 0.8
        .spaceSelectBtn
            max-width: 14rem
            overflow: hidden
            text-overflow: ellipsis
            white-space: nowrap
            padding:
                left: 12px
                right: 5px
                top: 0
                bottom: 0
            .textWrapper
                overflow: hidden
                text-overflow: ellipsis
    .n-input
        width: 25rem

.spaceSelectAction
    width: 100%
</style>

<style lang="sass">
.n-modal.login
    width: fit-content
    .n-card__footer
        padding: 1.2rem 0 2rem
    .n-upload .n-upload-file-info .n-upload-file-info__thumbnail .n-image
        height: 100%
        width: 100%
        img
            object-fit: cover !important

.n-base-select-option
    padding-right: calc(var(--n-option-padding-right)) !important
    .n-base-select-option__content
        width: 100% !important
        padding-right: 2rem

.searchInput.n-input .n-input__placeholder::before
        font:
            size: 12px
            weight: bold
            family: cascadia-code
        outline: 1px solid
        border-radius: 3px
        padding:
            top: 1px
            left: 4px
            right: 4px
        margin:
            top: 1px
            left: 3px
            right: 8px
        
.mac.searchInput .n-input__placeholder::before
    content: '⌘ K'
.win.searchInput .n-input__placeholder::before
    content: 'Ctrl K'
</style>