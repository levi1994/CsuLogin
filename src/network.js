/**
 * 所有网络请求方法
 */
var http = require('http');
let resolveCostHtml = require('./util.js').resolveCostHtml;
let showMessage = require('./util.js').showMessage;

var obj = {};

/**
 * 发送登录请求
 */
function sendLogin(acco, pass) {
    var accountID = acco + '@zndx.inter';
    var password = RSAUtils.encryptedString(publickey, encodeURIComponent(pass));
    var params = `accountID=${accountID}&password=${password}&brasAddress=${brasAddress}&userIntranetAddress=${userIntranetAddress}`;
    var options = {  
        hostname: '61.137.86.87',  
        port: 8080,  
        path: '/portalNat444/AccessServices/login?'+params,  
        method: 'GET',
        headers: {  
            "Content-Type": 'application/x-www-form-urlencoded',  
            "Content-Length": 12,
            "Referer": "http://61.137.86.87:8080/portalNat444/index.jsp",
        } 
    };
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {  
            console.log('BODY: ' + chunk);
            var data = JSON.parse(chunk);
            console.log(res);
            // 获得Cookie
            var setCookie = res.headers["set-cookie"][0];
            cookie = setCookie.split(";")[0].split("=")[1];
            loginStatus = true;
            getCostInfo();
            resoveLoginResult(chunk,acco,pass);
        });  
    });
    req.end();
}

/**
 * 发送退出登录请求
 */
function sendLogout(callback) {
    var params = `brasAddress=${brasAddress}&userIntranetAddress=${userIntranetAddress}`;
    var options = {  
        hostname: '61.137.86.87',  
        port: 8080,  
        path: '/portalNat444/AccessServices/logout?'+params,
        method: 'GET',
        headers: {  
            "Content-Type": 'application/x-www-form-urlencoded',  
            "Content-Length": 12,
            "Referer": "http://61.137.86.87:8080/portalNat444/index.jsp",
        } 
    };
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {  
            console.log('BODY: ' + chunk);
            let data = JSON.parse(chunk);
            if(data.resultCode == 0) {
                $(".success-pane").hide();
                $(".login-pane").show();
                if(callback) {
                    callback.call(this, chunk);
                }
                showMessage("success","登出成功");
                loginStatus = false;
            } else {
                showMessage("登出错误");
            }
        });  
    });
    req.end();
}

/**
 *  获得消费信息
 */
function getCostInfo() {
    // 如果尚未登录
    if(!loginStatus) {
        showMessage("warn","请先登陆再查询消费信息");
        return false;
    }
    var options = {  
            hostname: '61.137.86.87',  
            port: 8080,
            path: '/portalNat444/main2.jsp',
            method: 'GET',
            headers: {  
                "Content-Type": 'application/x-www-form-urlencoded',  
                "Content-Length": 12,
                "Referer": "http://61.137.86.87:8080/portalNat444/index.jsp",
                "Cookie": "JSESSIONID="+cookie,
            } 
        };
        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {  
                resolveCostHtml(chunk);
            });  
        });
        req.end();
}

/**
 * 保存登录账号信息
 */
function saveAccount(account, password) {
    var obj = {
        account: account,
        password: password
    }
    localStorage.setItem("account",JSON.stringify(obj));
}

/**
 * 解析登录结果
 */
function resoveLoginResult(data,accountID,password) {
    var data = JSON.parse(data);
    var code = data.resultCode;
    if(code == 0) {
        // 登录成功
        // $(".main-body").addClass("success");
        $(".success-pane").show();
        $(".login-pane").hide();
        $(".uname span").text(data.account);
        $(".lastupdate span").text(data.lastupdate);
        $(".surplusmoney span").text(data.surplusmoney);
        saveAccount(accountID, password);
        showMessage("success","登录成功");
    } else if (code == 2) {
        // 已经登录
        sendLogout(function() {
            $("#login").trigger("mousedown");
        });
    } else if (code == 1) {
        if(data.resultDescribe == null || data.resultDescribe =="") {
            showMessage('error', '其他原因认证拒绝');
        } else {
            showMessage('error', data.resultDescribe);
        }
    } else {
        showMessage("error","认证失败,错误码："+data.resultCode);
    }
}

obj.sendLogin = sendLogin;
obj.sendLogout = sendLogout;

module.exports = obj;