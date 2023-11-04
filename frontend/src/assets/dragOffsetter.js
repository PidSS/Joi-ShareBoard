export default class DragOffsetter {
    constructor(activePos, passivePos, ratio) {
        this.activeBasePos = activePos
        this.passiveBasePos = passivePos
        this.ratio = ratio ? ratio : 1
    }
    passivePos(activePos) {
        return (activePos - this.activeBasePos) * this.ratio + this.passiveBasePos
    }
}