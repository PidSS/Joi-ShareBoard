/**
 * 用于向错误处理中间件传递报错信息，能够携带HTTP状态码与错误信息指示
 * @extends Error
 */
module.exports = class ResError extends Error {
    
    /**
     * 需要返回的HTTP状态码
     * @type {number}
     */
    status

    /**
     * 需要返回的内容
     * @type {any}
     */
    resMsg

    /**
     * @param {number} status
     * @param {any} resMsg 
     * @param {string} errMsg 
     */
    constructor(status, resMsg, errMsg) {
        super(errMsg)
        this.status = status
        this.resMsg =  resMsg
    }
}