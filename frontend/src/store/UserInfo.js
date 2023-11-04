import { defineStore } from 'pinia'

export const useUserInfoStore = defineStore('userinfo', {
    state: ()=>({userinfo:{ uid:undefined, name: undefined, avatar_path: null }})
})