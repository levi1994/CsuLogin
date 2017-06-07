/**
 * 工具类函数
 */
let util = {};

util.showMessage = function(type, message) {
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

/**
 * 使用正则来提取HTML页面中的数值
 * 又到了考验我正则功底的时候了 QAQ
 */
util.resolveCostHtml = function(html) {
    var reg1 = /您的账户.*\d+(\.\d+)?/g;
    var reg2 = /您宽带账户.*\d+(\.\d+)?/g;
    var result = {};
    if(!html.match(reg1)){
        return;
    }
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

function isNull(value) {
    if(!value || value === 'null') {
        return true;
    } else {
        return false;
    }
}

util.isNull = isNull;

function resolveFloat(text) {
    let reg = /\d+(\.\d+)?/g;
    return text.match(reg)[0];
}

module.exports = util;