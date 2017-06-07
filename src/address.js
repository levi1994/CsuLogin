/**
 * 网络基础网络模块
 * 用于获得局域网地址
 * 
 * 获取步骤为：
 * 
 * 1. 尝试通过网络请求获得获得相关信息
 * 
 * 2. 如1获取失败，尝试通过Node api获取相关信息
 * 
 * 3. 如1、2都失败，则提示错误
 * 
 */

/**
 * 以Promise的形式导出
 */
module.exports = function(resolve, reject) {
    var promise = new Promise(getByAjax);
    promise.then(function(result) {
        // 判断是否为null
        if(!result.userIntranetAddress || result.userIntranetAddress == 'null') {
            result.brasAddress = '59df7586';
            result.userIntranetAddress = getByNode();
            if(!result.userIntranetAddress || result.userIntranetAddress == 'null') {
                reject(result);
            } else {
                resolve(result);
            }
        } else {
            resolve(result);
        }
    }).catch(function(result) {
        reject(result);
    });
}

/**
 * 使用Node api获取内网地址
 */
function getUserIntranetAddress() {
    // 获取内网IP
    var iface = require('os').networkInterfaces();
    for(let key in iface) {
        let face = iface[key];
        for(var i=0;i<face.length;i++){  
            var alias = face[i];
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal && !alias.address.startsWith("192")){  
                return alias.address;
            }
        }
    }
}

/**
 * 使用网络请求获得内网网址
 * 请求地址为：http://61.137.86.87:8080/portalNat444/index.jsp
 */
function getByAjax(resolve, reject) {
    // 初始化brasAddress和userIntranetAddress
    $.ajax({
        url:"http://www.jd.com",
        timeout: 1000,
        success: function(data) {
            // 如果尚未登录，则返回数字中南登录页
            // 在页面中获得brasAddress和userIntranetAddress
            // 如果已经登录，则返回的是百度
            // 此时通过请求http://61.137.86.87:8080/portalNat444/index.jsp获得登录页
            // 再在登录页中获得brasAddress和userIntranetAddress
            var $html = $(data);
            let userIntranetAddress;
            let brasAddress;
            if($html.length === 39) {
                brasAddress = $html[37].value;
                userIntranetAddress = $html[35].value;
            }
            var a = {
                brasAddress: brasAddress,
                userIntranetAddress: userIntranetAddress
            }
            resolve(a);
        },
        error: function(data) {
            reject(data);
        }
    });
}

/**
 * 调用Node API获得地址
 */
function getByNode() {
    // 获取内网IP
    var iface = require('os').networkInterfaces();
    for(let key in iface) {
        let face = iface[key];
        for(var i=0;i<face.length;i++){  
            var alias = face[i];
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal && !alias.address.startsWith("192")){  
                return alias.address;
            }
        }
    }
}
