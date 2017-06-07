let initEvents = require('./events.js');
let initAddress  = require('./address.js');
let showMessage = require('./util.js').showMessage;

/**
 * 初始化主页面
 */
module.exports = function() {
    window.publickey = RSAUtils.getKeyPair("10001","","a8a02b821d52d3d0ca90620c78474b78435423be99da83cc190ab5cb5b9b922a4c8ba6b251e78429757cf11cde119e1eacff46fa3bf3b43ef68ceb29897b7aa6b5b1359fef6f35f32b748dc109fd3d09f3443a2cc3b73e99579f3d0fe6a96ccf6a48bc40056a6cac327d309b93b1d61d6f6e8f4a42fc9540f34f1c4a2e053445");
    // 初始化登录状态
    window.loginStatus = false;
    // 初始化页面事件
    initEvents();

    // 初始化网络信息
    var promise = new Promise(initAddress).then(function(result) {
        window.userIntranetAddress = result.userIntranetAddress;
        window.brasAddress = result.brasAddress;
    }).catch(function(e){
        showMessage('error','网络错误');
    });
}