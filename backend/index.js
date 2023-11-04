const { app } = require('./src/app.js')
const { getValidIPs } = require('./tools/launch-term')

const server = app.listen(3673, ()=>{
    console.clear()
    console.log("Joi Shareboard\n后端服务启动成功\n")
    for (let ip of getValidIPs()) {
        console.log(`> ${ip}:${server.address().port}`)
    }
})