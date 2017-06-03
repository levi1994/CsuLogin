// You can also require other files to run in this process
var http = require('http');
const electron = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;

var sayHello = require('./src/util.js');
sayHello();

console.log(electron.remote.session)
var remote = electron.remote;
var session = electron.remote.session;
var net = electron.remote.net;

var loginStatus = false;

// 网络地址
let brasAddress = "59df7586";
let userIntranetAddress = getUserIntranetAddress();

/**
 * 获取内网地址
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

var publickey = RSAUtils.getKeyPair("10001","","a8a02b821d52d3d0ca90620c78474b78435423be99da83cc190ab5cb5b9b922a4c8ba6b251e78429757cf11cde119e1eacff46fa3bf3b43ef68ceb29897b7aa6b5b1359fef6f35f32b748dc109fd3d09f3443a2cc3b73e99579f3d0fe6a96ccf6a48bc40056a6cac327d309b93b1d61d6f6e8f4a42fc9540f34f1c4a2e053445");

$("#login").on("mousedown",function(){
    var acco = $("#account").val();
    var pass = $("#password").val();
    let flag = valid(acco, pass);
    if(!flag) {
        showMessage("warn","请输入账号密码");
        return false;
    }
    if(!brasAddress || brasAddress == "null" || !userIntranetAddress || userIntranetAddress == "null") {
        initAddress(function() {
            sendLogin(acco, pass);
        });
    } else {
        sendLogin(acco, pass);
    }
});

function initAddress(callback) {
    // 初始化brasAddress和userIntranetAddress
    $.ajax({
        url:"http://www.jd.com",
        success: function(data){
            // 如果尚未登录，则返回数字中南登录页
            // 在页面中获得brasAddress和userIntranetAddress
            // 如果已经登录，则返回的是百度
            // 此时通过请求http://61.137.86.87:8080/portalNat444/index.jsp获得登录页
            // 再在登录页中获得brasAddress和userIntranetAddress
            var $html = $(data);
            if($html.length === 39) {
                brasAddress = $html[37].value;
                userIntranetAddress = $html[35].value;
                callback();
            } else {
                showMessage("warn","已经登录了");
                // 请求http://61.137.86.87:8080/portalNat444/index.jsp
                $.ajax({
                    url: "http://61.137.86.87:8080/portalNat444/index.jsp",
                    success: function(data) {
                        var $html = $(data);
                        brasAddress = $html[37].value;
                        userIntranetAddress = $html[35].value;
                        callback();
                    }
                });
            }
        }
    });
}

$("#logout").on("mousedown",function(){
    sendLogout();
});

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
 * 使用正则来提取HTML页面中的数值
 * 又到了考验我正则功底的时候了 QAQ
 */
function resolveCostHtml(html) {
    var reg1 = /您的账户.*\d+(\.\d+)?/g;
    var reg2 = /您宽带账户.*\d+(\.\d+)?/g;
    var result = {};
    result.sum = resolveFloat(html.match(reg1)[0]);
    result.use = resolveFloat(html.match(reg1)[1]);
    result.surplus = resolveFloat(html.match(reg1)[2]);
    result.useSchool = resolveFloat(html.match(reg1)[3]);
    result.surplusMoney = resolveFloat(html.match(reg2)[0]);
    $(".aboutCost").find(".ccontent").eq(0).text(parseInt(result.sum/1024) + "G");
    $(".aboutCost").find(".ccontent").eq(1).text(parseInt(result.use/1024) + "G");
    $(".aboutCost").find(".ccontent").eq(2).text(parseInt(result.surplus/1024) + "G");
    $(".aboutCost").find(".ccontent").eq(3).text(parseInt(result.useSchool/1024) + "G");
    $(".aboutCost").find(".ccontent").eq(4).text(result.surplusMoney + "元");
    console.log(result);
}

function resolveFloat(text) {
    let reg = /\d+(\.\d+)?/g;
    return text.match(reg)[0];
}

/**
 * 验证输入合法性
 */
function valid(account, password) {
    if(!account || !password) {
        return false;
    }
    return true;
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

/**
 * 打开微博
 */
function showWeibo() {
    let win = new BrowserWindow({width: 800, height: 600,autoHideMenuBar: true})
    // Load a remote URL
     win.loadURL('http://weibo.com/u/5061669386/');
}

/**
 * 打开github
 */
function showGithub() {
    let win = new BrowserWindow({width: 800, height: 600,autoHideMenuBar: true})
    // Load a remote URL
    win.loadURL('https://github.com/levi1994/');
}

/**
 * 打开开发者工具
 */
function showDevtool() {
    var mainWindow = BrowserWindow.getFocusedWindow();
    mainWindow.webContents.openDevTools();
}

$(".weibo").click(function(){
    showWeibo();
});

$(".github").click(function(){
    showGithub();
});
$(".tools").click(function(){
    showDevtool();
});
$(".menu").click(function(){
    $(".menuspan").toggleClass("show");
});
$(".closemenu").click(function(){
    $(".menuspan").removeClass("show");
});
$(".t-aboutAuthor").click(function(){
    $(".closemenu").trigger("click");
    $(".aboutAuthor").addClass("show");
});
$(".t-cost").click(function(){
    if(!loginStatus) {
        showMessage("warn","请登录后再查询费用信息");
        return;
    }
    $(".closemenu").trigger("click");
    $(".aboutCost").addClass("show");
});
$(".closeAutonor").click(function(){
    $(".aboutAuthor").removeClass("show");
});
$(".closeCost").click(function(){
    $(".aboutCost").removeClass("show");
});
$(".t-back").click(function(){
    showMessage("info","请联系作者提交反馈");
});
$(".t-payment").click(function(){
    let win = new BrowserWindow({width: 800, height: 600,autoHideMenuBar: true})
    // Load a remote URL
    win.loadURL('http://www.189.cn/dqmh/my189/initMy189home.do?fastcode=10000271&isCorp=0');
});
$(".js-autoRelogin").change(function(){
    let flag = $(".js-autoRelogin").prop("checked");
    let config = JSON.parse(localStorage.getItem("config"));
    if(flag) {
        config.autoRelogin = true;
        showMessage("success","已开启定时重连");
        // 定时重连
        autoRelogin();
    } else {
        config.autoRelogin = false;
        showMessage("success","已关闭定时重连");
        clearInterval(window.autoTimer);
    }
    localStorage.setItem("config",JSON.stringify(config));
});
$(".js-autoLogin").change(function(){
    let flag = $(".js-autoLogin").prop("checked");
    let config = JSON.parse(localStorage.getItem("config"));
    if(flag) {
        config.autoLogin = true;
        showMessage("success","已开启自动登陆");
    } else {
        config.autoLogin = false;
        showMessage("success","已关闭定时重连");
    }
    localStorage.setItem("config",JSON.stringify(config));
});
$(".js-reConnect").change(function(){
    let flag = $(".js-reConnect").prop("checked");
    let config = JSON.parse(localStorage.getItem("config"));
    if(flag) {
        config.reConnect = true;
        reConnect();
        showMessage("success","已开启掉线重连");
    } else {
        config.reConnect = false;
        clearInterval(window.reConnectTimer);
        showMessage("success","已关闭掉线重连");
    }
    localStorage.setItem("config",JSON.stringify(config));
});

// 最小化
$(".min").click(function(){
    let win = BrowserWindow.getFocusedWindow();
    win.minimize();
});

let maximize = false;
$(".max").click(function(){
    let win = BrowserWindow.getFocusedWindow();
    // isMaximized这个API有问题？？？
    // alert(win.isMaximized());
    if(maximize){
        win.unmaximize();
        maximize = false;
    } else {
        win.maximize();
        maximize = true;
    }
});

$(".closeWin").click(function(){
    let win = BrowserWindow.getFocusedWindow();
    win.hide();
});


// 判断是否已有账号
let account = getAccount();
if(account) {
    $("#account").val(account.account);
    $("#password").val(account.password);
}

function getAccount() {
    let accountStr = localStorage.getItem("account");
    if(localStorage.getItem("account")) {
        return JSON.parse(accountStr);
    }
    return false;
}

function saveAccount(account, password) {
    var obj = {
        account: account,
        password: password
    }
    localStorage.setItem("account",JSON.stringify(obj));
}

// 自动登录
function autoRelogin() {
    if(window.autoTimer) {
        clearInterval(window.autoTimer);
    }
    window.autoTimer = setInterval(function(){
        // 登录
        $("#login").trigger("mousedown");
        console.log("已重新登录");
    },1000 * 60 * 60 * 10);
}

initConfig();
resolveConfig();

/**
 * 初始化配置文件
 */
function initConfig() {
    if(!localStorage.getItem("config")) {
        let config = {
            autoRelogin: true,
            autoLogin: false,
            reConnect: false
        };
        localStorage.setItem("config",JSON.stringify(config));
    }
    let config = JSON.parse(localStorage.getItem("config"));

    localStorage.setItem("config",JSON.stringify(config));
}

/**
 * 断线重连
 */
function reConnect() {
    if(!window.reConnectTimer) {
        window.reConnectTimer = setInterval(function(){
            // 尝试访问百度
            requestBaidu(function(){
                showMessage("success","尝试重新登录");
                $("#login").trigger("mousedown");
            });
        },5000);
    }
}

/**
 * 请求Baidu
 * 
 */
function requestBaidu(callback) {
    $.ajax({
        url:"https://www.baidu.com",
        timeout: 3000,
        success: function(){
            console.log("success");
        },
        error: function(error){
            callback();
        }
    });
}

/**
 * 通过配置文件初始化
 */
function resolveConfig() {
    let config = JSON.parse(localStorage.getItem("config"));
    if(config.autoRelogin) {
        autoRelogin();
        $(".js-autoRelogin").prop("checked",true);
    }
    if(config.autoLogin) {
        autoLogin();
        $(".js-autoLogin").prop("checked",true);
    }
    if(config.reConnect) {
        reConnect();
        $(".js-reConnect").prop("checked",true);
    }
}

/**
 * 自动登录
 */
function autoLogin() {
    var acco = $("#account").val();
    var pass = $("#password").val();
    if(acco && pass) {
        $("#login").trigger("mousedown");
    }
}


/**
 * 显示提示信息
 */
function showMessage(type, message) {
    let color = {
        success: "rgb(19, 206, 102)",
        error: "rgb(255, 73, 73)",
        warn: "rgb(247, 186, 42)",
        info: "rgb(80, 191, 255)"
    }
    let icon = {
        success: "icon-chenggong2",
        error: "icon-guanbifuzhi",
        warn: "icon-jinggao1",
        info: "icon-info"
    }

    let html = `
        <div class="messagewrap">
            <div class="status">
            <i class="iconfont"></i>
            </div>
            <div class="message">这是提示信息</div>
        </div>
    `;
    var $html = $(html);
    $html.find("i.iconfont").addClass(icon[type]);
    $html.find(".status").css("background",color[type]);
    $html.find(".message").text(message);

    $(".main-body").append($html);
    setTimeout(function(){
        $html.addClass("show");
    },100);
    
    setTimeout(function(){
        $html.removeClass("show");
        setTimeout(function(){
            $html.remove();
        },1000);
    },1500);
}