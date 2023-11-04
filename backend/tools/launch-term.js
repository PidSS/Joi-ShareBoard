const os = require('os');

exports.getValidIPs = function() {
    // 获取本机所有网络接口的信息
    const networkInterfaces = os.networkInterfaces();

    // 存储所有IP地址的数组
    const ipAddresses = [];

    // 遍历网络接口信息，获取IPv4地址
    Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];
    interfaces.forEach((iface) => {
        // 忽略非IPv4地址和内部地址
        if (iface.family === 'IPv4' && !iface.internal) {
        ipAddresses.push(iface.address);
        }
    });
    });

    ipAddresses.unshift("localhost");

    return ipAddresses
}