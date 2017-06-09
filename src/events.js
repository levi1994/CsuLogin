/**
 * 初始化界面上所有的事件
 */
let http = require('http');
const electron = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;
let remote = electron.remote;
let session = electron.remote.session;

let showMessage = require('./util.js').showMessage;
let sendLogin = require('./network.js').sendLogin;
let sendLogout = require('./network.js').sendLogout;
let sLogin = require('./network.js').sLogin;
let initAddress  = require('./address.js');

module.exports = function(){

$("#login").on("mousedown", function(){
    var acco = $("#account").val();
    var pass = $("#password").val();
    let flag = valid(acco, pass);
    if(!flag) {
        showMessage("warn","请输入账号密码");
        return false;
    }
    if(!window.brasAddress || window.brasAddress == "null" || !window.userIntranetAddress || window.userIntranetAddress == "null") {
        // 再度尝试初始化地址
        var promise = new Promise(initAddress).then(function(result) {
            window.userIntranetAddress = result.userIntranetAddress;
            window.brasAddress = result.brasAddress;
            sLogin(acco, pass);
        }).catch(function(e){
            showMessage('error','网络错误');
        });
    } else {
        sendLogin(acco, pass);
    }
});


$("#logout").on("mousedown",function(){
    sendLogout();
});

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
    let win = new BrowserWindow({width: 1080, height: 800,autoHideMenuBar: true})
    // Load a remote URL
    win.loadURL('https://github.com/levi1994/CsuLogin');
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
    if(!window.loginStatus) {
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
}