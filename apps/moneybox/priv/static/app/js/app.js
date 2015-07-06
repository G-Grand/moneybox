/**
 *  Глобальный объект для перевода валют из символьной мнемоники в числовую
 *  или в словестное представление
 *  Используется в функции: validation.js:checkCardConvert
 */
var translate = {
    "ru": {
        "currency": {
            "usd": "долл",
            "eur": "евро",
            "uah": "грн"   } },
    "mnm": {
        "currency": {
            "usd": "840",
            "eur": "978",
            "uah": "980"   } }
};

protos = [ $client ];

/**
 *  Глобальный переменная хранящаю текущую валюту в которой открывается договор
 *  Используется в функции:
 *      deleteSectionDepositWithoutTax, showHideBlocks, changeCurr, draw_deposits
 */
var currency = getCurrency();
/**
 *  Глобальный переменная для противодействия кешированию шаблонов
 *  Используется в функции: load, draw_deposits
 */
var timestamp = 1;
/**
 *  Глобальный переменная содержащая картинку клубнички
 *  Используется в функции: draw_deposits
 */
var img = "<img src=\"/static/app/img/klubnichka-icon_12.png\" alt=\"\">";
/**
 *  Глобальный массив хранящий возможные варианты валют для открытия
 *  Используется в функциях: showHideBlocks, draw_deposits
 */
var currs = ['uah', 'usd', 'eur'];
/**
 *  Глобальная переменная хранящая часть id текущей открытой формы
 *  Пример: id = "form_DP00_12_uah"; open_form = "DP00_12_uah";
 *  Используется в функциях: closeOpenedForm, showModal
 */
var open_form = '';
/**
 *  Хранит в себе nodeList из всех депозитов показанных на витрине.
 *  Используется в функции поиска по витрине enableSearch
 */
var depCase = "node list must be here";
/**
 *  Глобальный объект для хранения таймеров из функции setInterval
 */
var timerObj = {};
/*
 *  Глобальная переменная, в которой указано, первый раз показана стартовая форма или нет
 *  true - будет первый вызов; false - первый вызов уже состоялся, теперь будет второй и позже вызовы
 */
var firstCallStartForm = true;
/*
 *  Глобальная переменная, в которой хранится максимальная общая сумма пополнений в месяц,
 *  которая показывается по умолчанию в подсказке менеджеру при открытии депозита
 */
var fundingLimit = 0;
/**
 *  Глобальная переменная, в которой хранится информация о клиенте открывающем депозит
 */
var Client = {}

/**
 *  Добавляем функцию сравнения в обьект Array
 *  сравнивает по элементно и если есть хоть одно не совпадение считает массивы разными
 */
Array.prototype.compare = function (arr) {
    if(this.length != arr.length) { return false; }
    for(var i=0; i<this.length; ++i) { if(this[i] !== arr[i]) { return false; } }
    return true;
};

/**
 *  Функция вставки счетчика по заданному id:
 *   запускает обратный отсчет в заданном месте дом дерерва. Возвращаемое значение функцией
 *   setInterval записывается в глобальный обьект timerObj, который хранит в себе все таймеры
 *
 *    @param elementId - (string) id элемента в дом модели
 *    @param minutes  - (integer) количество минут
 *    @param seconds  - (integer) количество секунд
 *    @param callback - (function) ф-ция которая должна вызываться
 *                                    по завершению работы таймера
 *    @param options  - (Array|any) параметры передаваемые в callback
 *
 *    @return;
 */
function countdown(elementId, minutes, seconds, callback,options) {
    callback = callback || null;
    var time = minutes*60 + seconds,
        el = document.getElementById(elementId);
    timerObj[elementId] = setInterval(function() {
        if(time == 0) {
            clearInterval(timerObj[elementId]);
            if(callback) { callback(options); } }
        var minutes = Math.floor(time/60),
            seconds = time % 60;
        if (minutes < 10) { minutes = "0" + minutes; }
        if (seconds < 10) { seconds = "0" + seconds; }
        el.innerHTML = minutes + ':' + seconds;
        time--;
    }, 1000);
}

/**
 *  Функция делает елемент полностью серого цвета.
 *    @param elSelector (string) css селектор для поиска элемента
 *    @param maxGray (string) максимально серое значение, от 0 до 100
 */
function grayscaleElement(elSelector,maxGray) {
    var el = document.querySelector(elSelector);
    if(!el) { console.log("bad element 4 grayscale"); return false; }
    el.style.filter = "grayscale("+maxGray+"%)";
    el.style.webkitFilter = "grayscale("+maxGray+"%)";
    el.style.mozFilter = "grayscale("+maxGray+"%)";
}

/**
 *  Функция получения полжения по отношению к боди текущего элемента
 *    @param elem (string) css селектор для поиска элемента
 */
function getOffsetSum(elem) {
    var top=0, left=0;
    while(elem) {
        top = top + parseFloat(elem.offsetTop);
        left = left + parseFloat(elem.offsetLeft);
        elem = elem.offsetParent;
    }
    return {top: Math.round(top), left: Math.round(left)};
}

/**
 *  Ф-ция формирования и показа алерт сообщения.
 *  Устанавливается в боди с абсолютной позицией.
 *    @param msg (string) сообщение которое необходимо показать в алерте
 *    @param position (string) позиция на экране
 */
function initAlertMsg(msg,position) {
    var alert = document.createElement("DIV");
    alert.innerHTML = msg;
    alert.id = "alertMsg";
    alert.classList.add("alert");
    alert.classList.add("alert-danger");
    alert.style.position = "absolute";

    alert.style.filter = "grayscale(0%)";
    alert.style.webkitFilter = "grayscale(0%)";
    alert.style.mozFilter = "grayscale(0%)";
    document.body.appendChild(alert);
    switch(position) {
        case "center":
            alert.style.left = (window.innerWidth-alert.offsetWidth)/2+"px";
            if(open_form != '') {
                var cords = getOffsetSum(document.getElementById("form_"+open_form));
                alert.style.top = (cords.top != 0) ? (cords.top+"px") : "500px" ;
            }else {
                alert.style.top = "500px"; }
            break;
        case "top-left":
            alert.style.top = "0";
            alert.style.left = "0";
            break;
        case "top-right":
            alert.style.top = "0";
            alert.style.right = "0";
            break;
        case "bottom-left":
            alert.style.bottom = "0";
            alert.style.left = "0";
            break;
        case "bottom-right":
            alert.style.bottom = "0";
            alert.style.right = "0";
            break;
    }
}



/**
 *************************************************************
 **********************  OPEN functions **********************
 *************************************************************
 */

///////////////////// IVR событие /////////////////////
/**
 *  Стартуем таймер при отрисовке формы с ОТП паролем.
 *  Таймер равен 60 секунд.
 */
function startIVRTimer() { timerObj.ivrStartTime=(new Date()).getTime()+60000; }
/**
 *  Ф-ция I этапа отработки IVR.
 *  Проверяет прошла ли минута после посылки смс сообщения.
 *  Если минута прошла, то отрисовывает сообщение о возможности
 *  произвести IVR звонок, если не прошла - показывает таймер после
 *  которого будет возможно сделать IVR звонок.
 *
 *  @param elId (string) id главного div, в котором
 *      отрисовывается теккст подсказок IVR звонка
 */
function startIVRProc(elId) {
    var mainEl = document.getElementById(elId);
    var now = (new Date()).getTime();
    if(timerObj.ivrStartTime <= now) {
        console.log("bingo");
        showIVRStartMsg(elId);         // Ф-я III этапа
    }else {
        console.log("to soon");
        showIVRTimer(now,mainEl); // Ф-я II этапа
    }
}
/**
 *  Ф-ция II этапа отработки IVR
 *  Показывает таймер в основном блоке IVR события
 *
 *  @param now (int) реальное время в секундах
 *  @param mainEl (DOMElement) основной блок IVR события
 */
function showIVRTimer(now,mainEl) {
    mainEl.innerHTML = i18n("ivrTimerMsg");
    var timeLeft = (timerObj.ivrStartTime - now)/1000;
    countdown("cnt_ivr",0,Math.floor(timeLeft), showIVRStartMsg,mainEl.id);
}
/**
 *  Ф-ция III этапа отработки IVR
 *  Показывает сообщение о возможности IVR перезвона
 *  и ссылку для активации перезвона.
 *
 *  @param mainElId (string) id главного div, в котором
 *      отрисовывается теккст подсказок IVR звонка
 */
function showIVRStartMsg(mainElId) {
    var mainEl = document.getElementById(mainElId);
    mainEl.innerHTML = i18n("ivrAfterTimerMsg");
    var link = document.createElement("A");
    link.id = "ivrLink_"+mainElId;
    link.href = "#";
    link.innerHTML = i18n("ivrCallMe");
    mainEl.appendChild(link);
    link.addEventListener("click", needIVREnter);
}
/**
 *  Ф-ция IV этапа отработки IVR
 *  Посылаем события IVR перезвона в эрланг.
 *  В событие на эрланге передаем уникальную часть IVR id.
 *  В эрланге эта часть уникального id чаще всего выступает
 *  в роли переменной Atom.
 *  Событие на эрланге: deposits_open:event({client,{ivrAuth,Atom}})
 */
function needIVREnter() {
    var idAtom = this.parentNode.id.replace("ivr_","");
    this.parentNode.innerHTML = i18n("ivrLastStep_1")+Client.phone+i18n("ivrLastStep_2");
    ws.send(enc(tuple(atom('client'), tuple(atom('ivrAuth'),atom(idAtom)))));
}
/**
 *  Ф-ция V этапа отработки IVR
 *  Вызывается из эрланга после отработки события.
 *  В зависимомти от переданной в ф-ция информации, клиенту на экран покажется:
 *    - сообщение об отказе от IVR авторизации
 *    - сообщение об ошибке
 *    - вместо кнопок далее и отмена начнет вращаться спинер,
 *      тем самым символизируя успешный ответ на IVR звонок
 *
 *  @param response (string) содержит один из вариантов ответа:
 *           - "enter" (успешно подверждена операция входа)
 *           - "refuse" (отказ от входа через IVR звонок)
 *           - "error" (ошибка при попытке авторизоваться через IVR звонок)
 *  @param idPart (string) уникальная часть состоящая из типа договора,
 *           продолжительности и валюты (пример, "DE00_6_uah").
 *           Чаще всего используется для уникальности id формы и
 *           элементов пренадлежащих ей.
 */
function ivrResponse(response,idPart) {
    var mainElId = "ivr_"+idPart;
    var form = document.getElementById("form_"+idPart);
    switch(response) {
        case "enter":
            console.log("IN enter event!");
            form.querySelector("#forpreload").innerHTML = "<img src='/static/app/img/preloader.gif' />";break;
        case "refuse":
            console.log("IN refuse event!");
            document.getElementById(mainElId).innerHTML = i18n("ivrRefuse");break;
        default:
            console.log("IN default event!");
            document.getElementById(mainElId).innerHTML = i18n("ivrError");break;
    }
}
///////////////////// END IVR событие /////////////////////

/**
 *****************************************************************
 **********************  EDN OPEN functions **********************
 *****************************************************************
 */



/**
 *************************************************************
 ********************** Lobby functions **********************
 *************************************************************
 */

/**
 *  Сортирует (по дате) переданный массив по определенной колокнке,
 *  если содержимым данной колонки является строка соответсвующая:
 *    /^(\d+).(\d+).(\d+)<br>(\d+).(\d+).(\d+)$/
 *
 *      @param Arr - массив состоящий из дом элементов, внутри каждого дом
 *                 элемента находится следующая структура:
 *                        <div class="column6">
 *                        <div class="column20">
 *                        <div class="column14">
 *                        <div class="column10">
 *                        <div class="column14">
 *                        <div class="column12">
 *                        <div class="column14">
 *      @param colNum - (integer) число >= 0, номер столбца по которому необходимо осуществить выборку
 *
 *      @return отсортированный массив
 */
function sortByDate(Arr, colNum) {
    return Arr.sort(function(a, b) {
        var dateA = new Date(a.children[colNum].innerHTML.replace(/(\d+).(\d+).(\d+)<br>(\d+).(\d+).(\d+)/,'$2/$1/$3'));
        var dateB = new Date(b.children[colNum].innerHTML.replace(/(\d+).(\d+).(\d+)<br>(\d+).(\d+).(\d+)/,'$2/$1/$3'));
        if(dateA > dateB) { return -1; }
        else if(dateA < dateB) { return 1; }
        else { return 0; }
    }); }

/**
 *  Сортирует переданный массив по определенной колокнке,
 *  если содержимым данной колонки является любая строка (сортировка по алфавиту)
 *
 *      @params - смотри sortByDate
 *
 *      @return отсортированный массив
 */
function sortByName(Arr, colNum) {
    return Arr.sort(function(a,b) {
        var strA = a.children[colNum].innerHTML;
        var strB = b.children[colNum].innerHTML;
        return strA.localeCompare(strB)
    }); }

/**
 *  Сортирует переданный массив по определенной колокнке,
 *  если содержимым данной колонки является любая строка начинающаяся на число,
 *  преобразовывает ее в тип float и производит сортировку
 *
 *      @params - смотри sortByDate
 *
 *      @return отсортированный массив
 */
function sortByNumber(Arr, colNum) {
    return Arr.sort(function(a,b) {
        var intA = parseFloat((a.children[colNum].innerText)?a.children[colNum].innerText:a.children[colNum].textContent);
        var intB = parseFloat((b.children[colNum].innerText)?b.children[colNum].innerText:b.children[colNum].textContent);
        if(intA > intB) { return -1; }
        else if(intA < intB) { return 1; }
        else { return 0; }
    }); }

/**
 *  Функция сортировки витрины депозитов
 *      вешается в качестве eventListener на дивы с классом "sort"
 *      сортирует депозитную витрину по выбранной колонке
 *      Использует функции сортировки:
 *          sortByNumber, sortByName, sortByDate
 *
 *      @params ()
 *      @return;
 */
function sortShowcase() {
    var colNum = parseInt(this.parentNode.id)-1;
    var allIMGs = document.querySelectorAll("#tableHead div.sort img");
    var tableBody = document.getElementById("tableBody");
    var List = tableBody.children;
    var noSortArr = [], sortArr = [];
    var sign = "/static/app/img/sort-up.png";
    var direction = (/sort-up.png/.test(this.firstChild.src)) ? "down":"up";
    for(var j=0; j<allIMGs.length;++j) {
        allIMGs[j].src = "/static/app/img/sort.png"; }
    for(var i=0;i<List.length; ++i) {
        noSortArr[i] = List[i];
        sortArr[i] = List[i]; }
    switch(this.id) {
        case "sortDate": sortArr = sortByDate(sortArr, colNum); break;
        case "sortName": sortArr = sortByName(sortArr, colNum); break;
                default: sortArr = sortByNumber(sortArr, colNum); }
    if(sortArr.compare(noSortArr) || direction == "down") {
        sortArr = sortArr.reverse();
        sign = "/static/app/img/sort-down.png"; }
    this.firstChild.src = sign;
    tableBody.innerHTML = "";
    for(i=0;i<sortArr.length;++i) { tableBody.appendChild(sortArr[i]); }
}

/**
 *  Устанавливает новую ссылку для "печати списка депозитов"
 *  и вызывает нажатие на нее
 *  вызывается из события на эрланге event({client,{printDeposits, Deposits}})
 *
 *      @params()
 *      @return;
 */
function printDep() {
    var link = document.getElementById("pr"),
        salt = (new Date()).getTime(),
        newHref = "//"+window.location.host+"/static/doc/deposits_pdf/"+getParameterByName("csid")+"/depositslist.pdf?v="+salt;
    link.setAttribute("href",newHref);
    link.click(); }
/**
 *  Вызывает событие на эрланге event({client,{printDeposits, Deposits}}),
 *  которое формирует из текущего списка депозитов на витрине pdf файл
 *
 *      @params()
 *      @return;
 */
function printDepositsShowcase() {
    var deposits = document.getElementById("depositsTable").cloneNode(true);
    var lastsTD = deposits.querySelectorAll("div.td");
    var lastTH = deposits.querySelector("div.th");
    lastTH.removeChild(lastTH.lastChild.previousSibling);
    for(var i=0; i<lastsTD.length; ++i) {
        lastsTD[i].removeChild(lastsTD[i].lastChild); }
    ws.send(enc(tuple(atom('client'), tuple(atom('printDeposits'),utf8_toByteArray(deposits.outerHTML))))); }

/**
 *  Подсчитывает сумму депозитного портфеля клиента, отображаемого на витрине,
 *  в различных валютах
 *
 *      @param cur - (string) мнемоника валюты в символьном
 *                 представлении в нижнем регистре
 *
 *      @return (string) - полная сумма всех депозитов отображенных
 *                       на витрине в выбранной валюте, прим. "14.45 Гривен"
 */
function getFullSum(cur) {
    switch(cur){
        case "uah":
            return (myBalance.balance.uah*1 + myBalance.courses.usd.uah*myBalance.balance.usd + myBalance.courses.eur.uah*myBalance.balance.eur).toFixed(2) + " " + i18n("financeUAH");
        case "usd":
            return (myBalance.balance.usd*1 + myBalance.balance.uah/myBalance.courses.uah.usd + myBalance.balance.eur*myBalance.courses.eur.usd).toFixed(2) + " " + i18n("financeUSD");
        case "eur":
            return (myBalance.balance.eur*1 + myBalance.balance.uah/myBalance.courses.uah.eur + myBalance.balance.usd/myBalance.courses.usd.eur).toFixed(2) + " " + i18n("financeEUR"); } }
/**
 *  Функция переключения отображения суммы депозитного портфеля клиента
 *  в выбранную валюту
 *
 *      @param el - (DOMElement) элемент дом дерева по которому кликает клиент
 *      @return;
 */
function switchDepFullSum(el) {
    switchActiveCurr(el);
    document.getElementById("depFullSum").innerHTML = getFullSum(el.id); }
/**
 *  Отрисовка финансового блока
 *    - вызывается из события эрланга event({client,myFinance});
 *    - при отрисовке блока вставляет данные полученные после
 *      отрабатывания события на эрланге (myBalance обьект);
 *
 *      @param state - (string) состояние возвращенное событием эрланга
 *                   если "bad" то отобразить ошибку, в любом другом случае
 *                   начать отрисовку блока
 *
 *      @return;
 */
function showMyFinance(state) {
    var preload = document.getElementById("financePreload");
    if(state == "bad") {
        preload.innerHTML = "<p>Извините, произошел технический сбой.</p>";
        return; }
    var finBlock = document.getElementById("myFinanceBlock");
    preload.innerHTML = "";
    slideDown(finBlock, 400);
    console.log(myBalance);
    document.getElementById("sum_uah").innerHTML = myBalance.balance.uah;
    document.getElementById("sum_usd").innerHTML = myBalance.balance.usd;
    document.getElementById("sum_eur").innerHTML = myBalance.balance.eur;
    document.getElementById("courses").innerHTML = "<span style='margin-right:20px;font-size:14px'><b>USD:</b> "+myBalance.courses.usd.uah+"/"+myBalance.courses.uah.usd+"</span>"+
                                                   "<span style='margin-right:20px;font-size:14px'><b>EUR:</b> "+myBalance.courses.eur.uah+"/"+myBalance.courses.uah.eur+"</span>";
    document.getElementById("depFullSum").innerHTML = getFullSum("uah"); }
/**
 *  Вызывается при нажатии на блок "Мой капитал" в депозитной витрине
 *      - если блок раскрыт то ф-ция скрывает его, если скрыт
 *        то вызывается событие на эрланге через веб сокет канал
 *
 *      @params ()
 *      @return;
 */
function getFinBlock() {
    var finBlock = document.getElementById("myFinanceBlock");
    if(finBlock.style.display != "none") {
        slideUp(finBlock, 400); return; }
    document.getElementById("financePreload").innerHTML = "<div style='text-align:center;'><img src=\"/static/app/img/preloader.gif\"></div>";
    ws.send(enc(tuple(atom('client'), atom('myFinance')))); }

/**
 *  Отрисовка блока информации о выданных доверенностях
 *    - вызывается из эрланга событие event({client,proxyYouGranted});
 */
function getProxyGrantedToYou(){
    var theirProxyTable = document.getElementById("theirProxyTable");
    if(theirProxyTable.style.display == "none") {
        var theirProxyMsg = document.getElementById("theirProxyNoActiveDeposits");
        theirProxyMsg.innerHTML = "<div style='text-align:center;'><img src=\"/static/app/img/preloader.gif\"></div>";
        ws.send(enc(tuple(atom('client'), tuple(atom('getGrantedDeposits'), atom('theirProxy')))));
    } else {
        var theirProxyTableBody = document.getElementById("theirProxyTableBody");
        slideUp(theirProxyTable, 200);
        theirProxyTableBody.innerHTML = "";
    }
}

/**
 *  Отрисовка блока информации о выданных доверенностях
 *    - вызывается из эрланга событие event({client,proxyYouGranted});
 */
function getProxyYouGranted(){
    var myProxyTable = document.getElementById("myProxyTable");
    if(myProxyTable.style.display == "none") {
        var myProxyMsg = document.getElementById("myProxyNoActiveDeposits");
        myProxyMsg.innerHTML = "<div style='text-align:center;'><img src=\"/static/app/img/preloader.gif\"></div>";
        ws.send(enc(tuple(atom('client'), tuple(atom('getGrantedDeposits'), atom('myProxy')))));
    } else {
        var myProxyTableBody = document.getElementById("myProxyTableBody");
        slideUp(myProxyTable, 200);
        myProxyTableBody.innerHTML = "";
    }
}

/**
 *  Отрисовка блока информации о выданных завещаниях
 *    - вызывается из эрланга событие event({client,willYouGranted});
 */
function getWillYouGranted() {
    var myWillTable = document.getElementById("myWillTable");
    if(myWillTable.style.display == "none") {
        var myWillMsg = document.getElementById("myWillNoActiveDeposits");
        myWillMsg.innerHTML = "<div style='text-align:center;'><img src=\"/static/app/img/preloader.gif\"></div>";
        ws.send(enc(tuple(atom('client'), tuple(atom('getGrantedDeposits'), atom('myWill')))));
    } else {
        var myWillTableBody = document.getElementById("myWillTableBody");
        slideUp(myWillTable, 200);
        myWillTableBody.innerHTML = "";
    }
}

/**
 *  Отрисовка блока информации о закрытых (архивных) депозитах
 *    - вызывается из эрланга событие event({client,getArchiveDeposits});
 */
function getArchiveDeposits() {
    console.log("getArchiveDeposits");
    var archiveTable = document.getElementById("archiveDepositsTable");
    if(archiveTable.style.display != "none") {
        slideUp(archiveTable, 200);
        document.getElementById("archiveDepositsBody").innerHTML = ""; return; }
    document.getElementById("archiveNoDeposits").innerHTML = "<div style='text-align:center;'><img src=\"/static/app/img/preloader.gif\"></div>";
    ws.send(enc(tuple(atom('client'), atom('getArchiveDeposits'))));
}

/**
 *****************************************************************
 ********************** EDN Lobby functions **********************
 *****************************************************************
 */





/**
 *  Функция поиска родителя по имени класса. Если нет такого родителя
 *  то вернет false
 *      @param el - (DOMElement) элемент дом дерева внутри которого
 *                осуществляется поиск текстовых узлов
 *      @param clName - (string) имя класса элемента родителя которого надо найти
 *
 *      @return (string) - строка свормированная из всех текстовых узлов
 *                       найденных внутри элемента el
 */
function findAncestorByClassName(el,clName) {
    if(el.parentNode.classList.contains(clName)) {
        return el.parentNode; }
    if(el.parentNode.tagName == "BODY") {
        return false; }
    return findAncestorByClassName(el.parentNode, clName);
}


/**
 *  Функция поиска всех текстовых узлов в переданном элементе
 *
 *      @param el - (DOMElement) элемент дом дерева внутри которого
 *                осуществляется поиск текстовых узлов
 *
 *      @return (string) - строка свормированная из всех текстовых узлов
 *                       найденных внутри элемента el
 */
function findAllText(el) {
    var t = "";
    el = el.childNodes || el;
    for(var j=0; j<el.length; ++j) {
       t += (el[j].nodeType != 1) ? (el[j].nodeValue+" ") : findAllText(el[j].childNodes); }
    return t; }

/**
 *  Функция старта поиска для витрины депозитов
 *    - запускается при загрузке страницы;
 *    - навешивает eventListener на поле поиска
 *
 *      @params ()
 *      @return;
 */
function enableSearch() {
    depCase = document.querySelectorAll("#tableBody > .td");
    //console.log(depCase);
    var notFoundMsg = document.createElement("div");
    notFoundMsg.classList.add("td");
    notFoundMsg.setAttribute("style", "display:none;width:100%;text-align:center;background:#fff;padding:30px");
    notFoundMsg.setAttribute("id", "badSearch");
    notFoundMsg.innerHTML = "Поиск не дал результатов. Проверьте введенные данные.";

    document.getElementById("noActiveDeposits").appendChild(notFoundMsg);

    document.getElementById("depCaseSearch").addEventListener("keyup", function() {
        var search = (this.value == "") ? "showAll" : "needSearch";
        var regPan = (/^[0-9]{1,}$/.test(this.value)) ? new RegExp("^"+this.value) : null;
        var regExp = new RegExp(this.value, "i");
        document.getElementById("badSearch").style.display = "none";
        switch(search) {
            case "showAll":
                for(var i=0; i<depCase.length; ++i) { depCase[i].style.display = ""; } break;
            case "needSearch":
                var countFields = 0, elString;
                for(var i=0; i<depCase.length; ++i) {
                    if(regPan && regPan.test(depCase[i].id)) { countFields++; continue; }
                    elString = findAllText(depCase[i]);
                    if(regExp.test(elString)) {
                        depCase[i].style.display = "";
                        countFields++;
                    }else { depCase[i].style.display = "none"; } }
                if(countFields == 0) {
                    document.getElementById("badSearch").style.display = "block"; }
        }
    });
}

/**
 *  Подменяет url в меню табах на открытии
 *    - используется в случае когда клиент нажимает кнопку "Оформить"
 *      на калькуляторе для очистки url от не нужной инфы в гет параметрах
 *
 *      @param searchLink - (string) новая часть квери стринг для url
 *      @return;
 */
function setNewLinksForTabs(searchLink) {
    document.getElementById('calcLink').setAttribute("href", "calc.htm" + searchLink);
    document.getElementById('lobbyLink').setAttribute("href", "lobby.htm" + searchLink);
    document.getElementById('paymentsLink').setAttribute("href", "payments.htm" + searchLink);
}
/**
 *  Открывает форму "Оформления депозита" при переходе из калькулятора
 *  (при нажатии на кнопку оформить в калькуляторе)
 *
 *      @param btnId - (string) id кнопки "оформить" которую необходимо нажать
 *
 *      @return;
 */
function openFromCalc(btnId) {
    var href = window.location.search;
    var newHref = href.replace(/(\?|&)fromcalc=.{1,}/, "");
    document.getElementById(btnId).click();
    setNewLinksForTabs(newHref);
}

function __(type, param, lang) {
    return (translate[lang][type][param]);
}

/**
 *  Печать документов
 *  Функция вставляет URL в ссылку и нажимает на эту ссылку
 */
function printDoc(linkId, channel, sessionId) {
    var link = document.getElementById(linkId);
    link.href = "/doc/print/document.html?from="+channel+"&csid="+encodeURIComponent(sessionId);
    link.setAttribute('target', '_blank');
    link.click();
}

/**
 *  Функция вешает лисенеры на поля выбора типа и языка документа для печати,
 *  которые записывают выбранные значения в GET-запрос, передаваемый по ссылке на печать документа.
 *  Кроме того, значение выбранного языка считывается и записывается в GET-запрос сразу же.
 */
function changePrintDocLink(linkId,typeId,langId) {
    var link = document.getElementById(linkId);                                                         // ссылка (она же кнопка "Напечатать")
    var newUrl = changeParameterByName(querySourceRaw(langId), 'lang', link.getAttribute("href"));      // сразу меняем GET-параметр 'lang' на текущий выбраный
        link.setAttribute("href", newUrl);
    document.getElementById(typeId).addEventListener("click", function(){
        newUrl = changeParameterByName(querySourceRaw(typeId), 'doc', link.getAttribute("href"));
        link.setAttribute("href", newUrl);
    });
    document.getElementById(langId).addEventListener("click", function(){
        newUrl = changeParameterByName(querySourceRaw(langId), 'lang', link.getAttribute("href"));
        link.setAttribute("href", newUrl);
    });
}

/**
 *  Функция снова вешает лисенер на поле выбора языка документа для печати,
 *  который записывает выбранное значение языка в GET-запрос, передаваемый по ссылке на печать документа.
 *  Кроме того, значение выбранного языка считывается и записывается в GET-запрос сразу же.
 */
function changePrintDocLinkOnlyLang(linkId,langId) {
    var link = document.getElementById(linkId);
    var newUrl = changeParameterByName(querySourceRaw(langId), 'lang', link.getAttribute("href"));
    link.setAttribute("href", newUrl);
    document.getElementById(langId).addEventListener("click", function(){
        newUrl = changeParameterByName(querySourceRaw(langId), 'lang', link.getAttribute("href"));
        link.setAttribute("href", newUrl);
    });
}

// Удаление event listeners с указание выборки элементов по селектору css, именем события и именем ф-ции
function deleteEventListeners(selectorRule, eventName, fun) {
    var buttons = document.querySelectorAll(selectorRule);
    for(var i=0; i<buttons.length; ++i) {
        buttons[i].removeEventListener(eventName, eval(fun), false); }
}

// функция для плавного раскрытия объекта
function slideDown(obj, speed, startHeight) {
    startHeight = startHeight || 0;
    var mySpeed = speed || 300;
    var intervals = mySpeed / 30; // we are using 30 ms intervals
    var holder = document.createElement('div');//
    var parent = obj.parentNode;
    holder.setAttribute('style', 'height: '+startHeight+'px; overflow:hidden');
    parent.insertBefore(holder, obj);
    parent.removeChild(obj);
    holder.appendChild(obj);
    obj.style.display = obj.getAttribute("data-original-display") || "";
    var height = obj.offsetHeight;
    var sepHeight = height / intervals;
    var timer = setInterval(function() {
        var holderHeight = holder.offsetHeight;
        if (holderHeight + sepHeight < height) {
            holder.style.height = (holderHeight + sepHeight) + 'px';
        } else {
            // clean up
            holder.removeChild(obj);
            parent.insertBefore(obj, holder);
            parent.removeChild(holder);
            clearInterval(timer);
        }
    }, 30);
}
// функция для плавного закрытия объекта
function slideUp(obj, speed) {
    var mySpeed = speed || 300;
    var intervals = mySpeed / 30; // we are using 30 ms intervals
    var height = obj.offsetHeight;
    var holder = document.createElement('div');//
    var parent = obj.parentNode;
    holder.setAttribute('style', 'height: ' + height + 'px; overflow:hidden');
    parent.insertBefore(holder, obj);
    parent.removeChild(obj);
    holder.appendChild(obj);
    var originalDisplay = (obj.style.display !== 'none') ? obj.style.display : '';
    obj.setAttribute("data-original-display", originalDisplay);
    var sepHeight = height / intervals;
    var timer = setInterval(function() {
        var holderHeight = holder.offsetHeight;
        console.log(holderHeight);
        if (holderHeight - sepHeight > 0) {
            holder.style.height = (holderHeight - sepHeight) + 'px';
        } else {
            // clean up
            obj.style.display = 'none';
            holder.removeChild(obj);
            parent.insertBefore(obj, holder);
            parent.removeChild(holder);
            clearInterval(timer);
        }
    }
    , 30);
}

// показывает подсказку под полем формы, где пользователь допустил ошибку
function showErrorMSG(el, msg, elId) {
    elId = elId || null;
    var parent = el.parentNode;
    if(!elId) {
        if(parent.lastChild.tagName == "DIV" && parent.lastChild.className == "errorMSG")
            parent.removeChild(parent.lastChild);
    }else {
        var divmsg = parent.querySelector("#"+elId) || null;
        if(divmsg != null) (divmsg.parentNode).removeChild(divmsg);
    }
    if(msg != "") {
        el.classList.add("error");
        var div = document.createElement('div');
        div.setAttribute("style", "padding:2px 0; color: #DD0000; font-size: 12px; font-style: italic;");
        div.classList.add("errorMSG");
        if(elId) div.id = elId;
        div.innerHTML = "<p style='float:left; margin:0;width:97%;'>"+msg+"</p>";
        parent.appendChild(div);
    }
}
// убрать подсказку (сообщение об ошибке)
function removeErrorMSG(form, field) {
    form = document.getElementById(form),
    el = form.querySelector("input[id^='"+ field +"']");
    var parent = el.parentNode;
        console.log(parent);
        console.log(parent.lastChild);
        console.log(parent.lastChild.className);
    if(parent.lastChild.tagName == "DIV" && parent.lastChild.className == "errorMSG") parent.removeChild(parent.lastChild);
}
// убирает все сообщения об ошбке с текущего элемента
function removeAllErrorsFromInput(el) {
    el.classList.remove('error');
    showErrorMSG(el, ""); }

/**
 * Устанавливает картинку лоадера вместо кнопок
 */
function setPreload(selector) {
    var el = document.querySelector(selector);
    el.innerHTML = "<div class='form' style='text-align:center;'><img src=\"/static/app/img/preloader.gif\"></div>";
}

 // Устанавливает картинку лоадера туда, где будет открываться форма операций по депозиту
function setPreloadInDetails(selector, num) {
    var el = document.querySelector(selector);
    var div1 = "<div class=\"arrow arrow_"+num+"\"></div>";
    var div2 = "<div class='form' style='text-align:center;'><img src=\"/static/app/img/preloader.gif\"></div>";
    el.innerHTML = div1 + div2;
}

/**
 * Устанавливает фокус по переданному селектору (css)
 */
function setFocus(selector) {
    var el = document.querySelector(selector);
    if(el){
        el.focus();
        if('value' in el) {
            var len = el.value.length;
            el.setSelectionRange(len, len);
        }
    }
}

function showModal(text, btns) {
    btns = btns || null;
    var sectionBtns = document.getElementById("modalSectionBtns");
    document.getElementById("modalText").innerHTML = text;
    switch(btns) {
        case "no":
            sectionBtns.innerHTML = ""; break;
        case "convertation":
            var backToPrev = function() {
                    console.log(open_form);
                    ws.send(enc(tuple(atom('direct'), tuple(atom('BackOpen'),open_form))));
                    closeModalWindow(); };
            sectionBtns.style.textAlign = "right";
            sectionBtns.style.borderTop = "1px solid #ddd";
            sectionBtns.style.background = "#f5f5f5";
            sectionBtns.style.margin = "0";
            sectionBtns.style.padding = "15px";
            sectionBtns.innerHTML = "<a id='backOnPrevBtn' href='#' class='button cancel' style='cursor: pointer;font-size:12px'>" + i18n("Cancel") + "</a>" +
                                    "<a id='modalButton' href='#' class='button sgreen' style='cursor: pointer;font-size:12px;' onclick='closeModalWindow();'>" + i18n("Confirm") + "</a>";
            document.getElementById("backOnPrevBtn").addEventListener("click", backToPrev, false);
            break;
        default:
            sectionBtns.innerHTML = "<a id='modalButton' href='#' class='button sgreen' style='padding: 8px 20px;cursor: pointer;' onclick='closeModalWindow();'>Ok</a>";
    }
    document.getElementById("modal_form").style.display="block";
    document.getElementById("overlay").style.display="block";
}
/**
 * Показывает модальное окно предупреждения
 */
function messageWrongOTP() {
    document.getElementById("modal_form").style.display="block";
    document.getElementById("overlay").style.display="block";
}
/**
 * Скрывает модальное окно предупреждения
 */
function closeModalWindow() {
    document.getElementById("modal_form").style.display="none";
    document.getElementById("overlay").style.display="none";
}

/**
 * Переключает радио-баттон причины расторжения депозита в положение "Другое",
 * активирует поле ввода причины и сразу же устанавливает фокус на нём.
 */
function setMyReason() {
    var el = document.getElementById('reason6');
    if(el.checked == false) {
        el.checked=true;
        onElement('myReason');
    }
}

/**
 * Включает элемент, например поле ввода причины расторжения депозита
 */
function onElement(id) {
    var el = document.getElementById(id);
    if(el.disabled==true) el.disabled=false;
    el.focus();
}

/**
 * Отключает элемент, например поле ввода причины расторжения депозита
 */
function offElement(id) {
    var el = document.getElementById(id);
    el.value = '';
    if(el.disabled==false) el.disabled="disabled";
}

/**
 *  функция добавляет разряды при вводе цифр в текстовое поле
 *
 *      @param event - событие которое происходит
 *      @return;
 */
function beautiful_numbers(event) {
    var n = event.target;
    var inp = n.value.replace(/ /g,"");
    n.value =  inp.replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
    console.log("Butifier");
    return;
}

/**
 * Фильтр для полей ввода телефона, ОТП, денежных едениц
 * @param        ev - событие js
 * @param maxLength - максимальная длинна строки для ввода
 * @param fieldType - тип поля, определяет фильтр по вводу символов
 *                    допустимые выражения: phone, otp, money
 */
function fieldsFilter(ev, maxLength, fieldType) {
    console.log("filtersField");
    var char  = String.fromCharCode(ev.charCode);
    if (ev.keyCode == 13) {
        var form = ev.target;
        while(true) {
            form = form.parentNode;
            if(form.getAttribute("id") != null && form.getAttribute("id").substring(0, 4) == "form") break;
        }
        form.querySelector("a.button.sgreen").click();
    } else if( (ev.charCode == 0) ) { return true; }
      else if( /[^\d,\.\-]/.test(char)) { return false; }
    else{
        var input = ev.target;
        var clearVal = input.value.replace(/ /g,"");
        removeAllErrorsFromInput(input);
        switch(fieldType){
            case   'otp':
            case 'bonus':
            case 'phone':
                if (/[^\d]/.test(char)) return false;
                if (input.selectionStart != input.selectionEnd) return true;
                break;
            case 'money':
                if (/[^\d,\.]/.test(char)) return false;
                char = (char==",") ? ".": char;
                if( input.selectionStart != input.selectionEnd && char!=".") return true;
                if( /^0(\.\d{1,2}){0,1}/.test(clearVal) && char == "0" && (input.selectionStart == 0 || input.selectionStart == 1) ) return false;
                if( /^0(\.\d{1,2}){1}/.test(clearVal) && char != "0" && char != "." && (input.selectionStart == 1) ) {
                    input.value = char + clearVal.substring(1);
                    return false; }
                if( /^\d+\.\d{2,}/.test(clearVal) && (input.selectionStart <= clearVal.indexOf(".")) && (clearVal.length < maxLength) && char!="." ) return true;
                if( /^\./.test(clearVal) && (input.selectionStart == 0) && (char == ".") ) {
                    input.value = "0" + clearVal.substring(input.selectionStart);
                    return false; }
                if( (clearVal == "") && (char == ".") ) {
                    input.value = "0"+char;
                    return false; }
                if( /^0$/.test(clearVal) && char != "." ) {
                    input.value+= "."+char;
                    return false; }
                if(/^\d+$/.test(clearVal) && (char == ".") && (clearVal.length< maxLength) ) {
                    input.value = clearVal.substring(0,input.selectionStart) + "." + clearVal.substr(input.selectionStart,2);
                    return false; }
                if(/^\d+\..*\.|\d+\.\d{2,}/.test(clearVal) || (/^\d+\./.test(clearVal) && char == ".") ) return false;
                break;
            case 'date':
                var start = input.selectionStart;
                if( input.type == "date") return true;
                if( /[^\d\-]/.test(char)) return false;
                if( input.selectionStart != input.selectionEnd) return true;
                if( /^\d{4}\-\d{1}\-\d{0,2}$/.test(clearVal) && (start > 4) && (start < clearVal.length-2) && char!="-" ) return true;
                else if( /^\d{4}\-\d{1}\-\d{2}$/.test(clearVal) ) return false;
                if( ((start == 4) || (start == 7) || (start == 6)) && char=="-" && clearVal[start-1]!="-" && clearVal[start]!="-" ) return true;
                else if( ((start != 4) && (start != 7)) && char!="-") {}
                else return false;
                break;
        }
        if(clearVal.length >= maxLength) {
            input.value = clearVal.slice(0,maxLength);
            return false;
        }
    }
}

/**
 *  для смены URL на приват24 или другие
 */
function changeUrlHost(elId, name) {
    var el = document.getElementById(elId),
        parentUrl = window.parent.location, url="#";
    try{
        var from = getParameterByName('from');
        switch(name) {
            case "my_deposits":
                if (from == "p24") {
                    try{ url = "https://privat24.privatbank.ua/p24/news#deposit/my"; }
                    catch(e) { url = "https://privat24.privatbank.ua/p24/news#deposit/my"; }
                    el.setAttribute("href", url);
                    el.setAttribute("target", "_top");
                }else {
                    el.setAttribute("href", "https://privat24.privatbank.ua/p24/news#deposit/my");
                    el.setAttribute("target", "_top"); }
                break;
            default:
                el.setAttribute("href", "#");
        }
    }catch(e) { console.log(e); }
}

/**
 *  замена/удаление кнопок на открытии депозита
 */
function deletePosteRestanteButton() {
    var btn = document.querySelector("#PADV a.button.sgreen"),
        parentUrl = window.parent.location, url="#";
    try{ btn.parentNode.removeChild(btn); } catch(e) {}             // на депозитных сертификатах не будет этой кнопки, поэтому тут try...catch
    try{
        var btn2 = document.querySelector("#KOPI a.button.sgreen");
        var from = getParameterByName('from');
        if (from == "p24"){
            try{ url = "https://privat24.privatbank.ua/p24/news#moneybag"; }
            catch(e) { url = "https://privat24.privatbank.ua/p24/news#moneybag"; }
            btn2.setAttribute("href", url);
            btn2.setAttribute("target", "_top");
        }else {
            btn2.setAttribute("href", "http://privatbank.ua/"+lang+"/kopi/");
            btn2.setAttribute("target", "_top"); }
    }catch(e){ console.log(e); }
}

/**
 *  удаление раздела "Стандарт безналоговый"
 */
function deleteSectionDepositWithoutTax() {
    var sec = document.querySelector("#deposit_without_tax");
    if (sec!=null) {
        if (currency != "uah") { sec.setAttribute("style","display:none"); }
        else { sec.setAttribute("style","display:block"); }
    }
}

/**
 *  получение параметра из URL
 */
function getParameterByName(name,url) {
    url = url || window.location.search;
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function changeParameterByName(newVal, paramName, url) {
    url = url || window.location.search;
    var paramVal = getParameterByName(paramName, url);
    return url.replace(paramVal, newVal);
}

/**
 *  закрытие всех открытых форм
 */
function closeOpenedForm() {
    var x = document.getElementById('form_'+open_form);
    if (x) x.style.display = 'none';
    x = document.getElementById('line_'+open_form);
    if (x) x.style.display = '';
}

/**
 *  сокрытие формы пополнения
 */
function closeCharge() {
    var x = document.getElementById('form_depositCharge');
    if (x) x.style.display = 'none';
}

/**
 *  Устанавливает тултип в зависимости от переданной позиции
 *  возможные варианты позиций: left, right, top, bottom
 *
 *      @param obj - DOMElement обычно это тег <a> в структуре тултипа
 *      @param position - (string) место расположения тултипа по
 *                      отношению к содержимому переменной obj
 *
 *      @return;
 */
function setHeight(obj, position) {
    position = position || "left";
    //console.log(obj.querySelector("span"));
    var span = obj.querySelector("span");
    var parent = obj.parentNode;
    span.style.width = (span.innerHTML.length <=28) ?
                            ( (span.innerHTML.length <=10) ? "80px":"170px" ) : "230px";
    switch(position) {
        case "left":
            span.classList.add("left");
            span.style.marginTop = String(-span.offsetHeight/2) + "px"; break;
        case "right":
            span.classList.add("right");
            span.style.marginTop = String(-span.offsetHeight/2) + "px"; break;
        case "top":
            span.classList.add("top");
            span.style.marginLeft = String(-(span.offsetWidth+parent.offsetWidth)/2) + "px"; break;
        case "bottom":
            span.classList.add("bottom");
            span.style.marginLeft = String(-(span.offsetWidth+parent.offsetWidth)/2) + "px"; }
    if(span.getBoundingClientRect().left < 0) {
        span.style.marginLeft = "0px";
    }else if(span.getBoundingClientRect().right > window.innerWidth) {
        span.style.marginLeft = String(-(Math.abs(parseFloat(span.style.marginLeft)) + Math.abs(span.getBoundingClientRect().right-window.innerWidth)+15)) +"px"; }
}
/**
 * Открывает и закрывает в форме блок с комментариями для менеджера с фронта
 */
function showComment(obj) {
    var next = obj.parentNode.nextSibling;
    if (next.style.display == "none") {
        next.style.display = "";}
    else {next.style.display = "none";}
}

/*
 * Показывает комментарии в форме для менеджера с фронта при первом показе формы
 */
function showFirstComment(atom,isStartForm) {
    if ((isStartForm == 'noStartForm' && document.getElementById('comment1_'+atom) != null) ||  // если это не стартовая форма и найден блок комментариев
        (firstCallStartForm == true && document.getElementById('comment1_'+atom) != null)) {    // если это первый вызов стартовой формы и найден блок комментариев
        var commentBlock = document.getElementById('comment1_'+atom).parentNode;                // div в котором содержится и тултип и сам комментарий
        commentBlock.children[2].style.display="none";                                          // тултип скрываем
        commentBlock.children[3].style.display="";                                              // блок с комментарием показываем
        var nextElement = commentBlock.nextSibling;
        while(nextElement != null) {
            nextElement.style.display = "none"
            nextElement = nextElement.nextSibling;
        }
        var button = "<div id='closeFirstComment_comment1_"+atom+"' class='buttons'>";
        button += "<a class='button sgreen' href='javascript:void(0);'>"+i18n("Next")+"</a></div>";
        commentBlock.parentNode.appendChild(dom(button));
        document.getElementById('closeFirstComment_comment1_'+atom).addEventListener("click", hideFirstComment);
    }
}

/*
 * Скрывает комментарии в форме для менеджера с фронта при первом показе формы
 */
function hideFirstComment() {
    var btn = this.id.split('_');                                                       // был у кнопки айдишник такой: 'closeFirstComment_comment1_DP00_12_uah'
    var id = btn[1]+"_"+btn[2]+"_"+btn[3]+"_"+btn[4];                                   // собираем айдишник коммента: 'comment1_DP00_12_uah'
    var nextNum = parseInt(btn[1].split("comment")[1])+1;
    var nextId = "comment"+nextNum+"_"+btn[2]+"_"+btn[3]+"_"+btn[4];                    // собираем айдишник следующего коммента: 'comment2_DP00_12_uah'
    var commentBlock = document.getElementById(id).parentNode;                          // div в котором содержится и тултип и сам комментарий
    commentBlock.children[2].style.display="";
    commentBlock.children[3].style.display="none";
    var nextElement = commentBlock.nextSibling;
    while(nextElement != null && nextElement.id != 'commentBlock') {
        nextElement.style.display = "";
        nextElement = nextElement.nextSibling;
    }
    document.getElementById('closeFirstComment_'+id).removeEventListener('click', hideFirstComment);
    if(nextElement == null) document.getElementById('closeFirstComment_'+id).outerHTML = "";
    else {
        nextElement.style.display = "";                                                        // весь элемент показываем
        nextElement.children[2].style.display="none";                                          // тултип скрываем
        nextElement.children[3].style.display="";                                              // блок с комментарием показываем
        document.getElementById('closeFirstComment_'+id).id = 'closeFirstComment_'+nextId;     // меняем айдишник кнопки
        document.getElementById('closeFirstComment_'+nextId).addEventListener("click", hideFirstComment);   // навешиваем на кнопку лисенер
    }
    firstCallStartForm = false;
}

/*
 * Функция навешивает ещё один listener на поле ввода суммы открытия депозита, а также
 * запоминает максимальную сумму пополнения в месяц в речевом модуле для операциониста,
 * который показывается при открытии депозита
 */
function addListenerToChangeFundingLimit(atom) {
    fundingLimit = document.getElementById("fundingLimit_"+atom);
    if(fundingLimit) {
        fundingLimit = fundingLimit.innerHTML;
        var el = document.getElementById('money_'+atom);
        el.addEventListener('keyup', changeFundingLimit);
        changeFundingLimit(el);
    } else {
        fundingLimit = 0;
    }
}

/*
 * Функция изменяет максимальную сумму пополнения в месяц в речевом модуле для операциониста,
 * который показывается при открытии депозита
 */
function changeFundingLimit(el) {
    el = el.target || el;                   // если передано событие, то берём из него элемент. Если нет - значит приходит сразу елемент
    var value = el.value.replace(/ /g,"");
    var atom = el.id.split("money_")[1];
    var span = document.getElementById("fundingLimit_"+atom);
    var prevVal = span.innerHTML;
    if (parseInt(fundingLimit.replace(/ /g,"")) < parseFloat(value)) {
        span.innerHTML = el.value;
    } else {
        span.innerHTML = fundingLimit;
    }
    if (prevVal != span.innerHTML) {
        var transparency = 1;
        var color = 255;
        var size = 5;
        var timer = setInterval(function() {
            if (transparency > -1) {
                span.style.textShadow = "0 0 3px rgba(255,0,0,"+(1 - Math.abs(transparency))+")";
                span.style.color = "rgb("+(255 - Math.abs(color))+", 0, 0)";
                span.style.fontSize = (13+(5-Math.abs(size)))+"pt";
                transparency = transparency - 0.1;
                color = color - 25.5;
                size = size - 0.5;
            } else {
                span.style.textShadow = "";
                span.style.color = "";
                clearInterval(timer);
            }
        }, 30);
    }
}

/**
 * Возвращет выбранную валюту на странице оформления депозита
 */
function getCurrency() {
    var currency = document.getElementById('currencys');
    return (currency == null) ? null : currency.querySelector('li.active').getAttribute('id').toLowerCase();
}

function load(u, complete) {
    var url = u + "?q=" + timestamp;
    var result = localStorage.getItem(url);
    result = null; // TODO: uncomment in production
    if (null == result) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, !0), xhr.onload = function() {
            localStorage.setItem(url, xhr.responseText),
            complete(xhr.responseText);
        }, xhr.send();
    } else complete(result);
}

/**
 * Переключение активной кнопки валюты
 */
function switchActiveCurr(el) {
    if(el.classList.contains("active")) return;
    el = el.querySelector("a");
    var curs = document.getElementById('currencys');
    var activeCurr = curs.querySelector('li.active');
    var text = activeCurr.firstChild;
    activeCurr.removeChild(activeCurr.firstChild);
    activeCurr.innerHTML = '<a class="menu__link submenu__link button2" href="javascript:void(0);">'+text.nodeValue+'</a>';
    activeCurr.classList.remove("active");
    el.parentNode.classList.add("active");
    text = el.firstChild.nodeValue;
    activeCurr = el.parentNode;
    activeCurr.removeChild(el);
    activeCurr.innerHTML = text;
}

function showHideBlocks(show) {
    var curNum = currs.indexOf(currency);
    var notActiveCurr = document.querySelectorAll('div[id^="block'+curNum+'"]');
    var disp = "none";
    if(show) { disp = "block"; }

    var kop = document.getElementById('KOPI');
    if(kop!=null) {
        kop = kop.parentNode;
        kop.style.display = (curNum != 0) ? "none" : "block";
    }

    for(var i=0; i<notActiveCurr.length; ++i) {
        notActiveCurr[i].style.display = disp;
    }
}

/**
 * Перерисовывает депозиты в зависимости от выбранной валюты
 */
function changeCurr(el) {
    currency = el.id;
    showHideBlocks(false);
    switchActiveCurr(el);
    draw_deposits();
    showHideBlocks(true);
    deleteSectionDepositWithoutTax();
    deletePosteRestanteButton();
}

function draw_deposits() {
    c = currs.indexOf(currency);
    for (var p=0;p<programs.length;p++) {
        var link = document.getElementById(programs[p].code);
        if (link==null) continue;
        while (link.firstChild) { link.removeChild(link.firstChild); }
        for (var i=0;i<programs[p].rates.length;i++) {

            if (!programs[p].rates[i].curr[currency]) continue;
            var obj = {
                name: programs[p].code + "_" +
                      programs[p].rates[i].duration + "_" +
                      currency,
                duration: programs[p].rates[i].duration + " " + i18n("Months"),
                display_name: i18n("OpenApp"),
                charge: i != 0 ? "" : (programs[p].charge == "y") ? i18n("Yes") : i18n("No"),
                rate_on_close: i != 0 ? "" : programs[p].rate_on_close ? i18n("OnReturn") : i18n("Monthly"),
                rate: programs[p].rates[i].curr[currency].rate + "%",
                bonus: (programs[p].rates[i].curr[currency].bonus != 0) ? img + programs[p].rates[i].curr[currency].bonus + "%" : "",
                renewal_bonus: (programs[p].rates[i].curr[currency].renewal_bonus != 0) ? "+" + programs[p].rates[i].curr[currency].renewal_bonus + "%" : "",
                bottomline: i == programs[p].rates.length - 1 ? "" : "bottom-line",
                withdraw: i != 0 ? "" : programs[p].withdraw  ? i18n("Yes") : i18n("No")
            };
            if(window.location.pathname.indexOf("certificates") != -1) {
                var rateNode = template(localStorage.getItem("/static/app/templates/line_certificates.htm?q=" + timestamp), obj);
            } else {
                var rateNode = template(localStorage.getItem("/static/app/templates/line.htm?q=" + timestamp), obj);
            }
            link.appendChild(dom(rateNode));
        }
    }
}


function appRun() {
    if(window.location.pathname.indexOf("certificates") != -1) {
        var file = '/static/app/templates/line_certificates.htm';
    } else {
        var file = '/static/app/templates/line.htm';
    }
    load(file, function(y) {
        draw_deposits();
        showHideBlocks(0, true);
        deletePosteRestanteButton();
        N2O_start();
    }); }

detectLanguage();

if (!window.location.pathname.endsWith("open.htm")) N2O_start();
  else appRun();




/**
 *************************************************************
 ******************** WS connection funcs ********************
 *************************************************************
 */

(function(){
    console.log("set ws funcs");
    var cnt=0;
    timerObj["ws_funcs"] = setInterval(function() {
        console.log("in ws_func setInterval");
        if(ws) {
            ws.ondisconnect = function() {
                active = false;
                console.log("Disconnect WebSocket");
                if(!document.getElementById("alertMsg")) {
                    showDisconnectError(); }
            };
            ws.onopen = function() {
                if (!active) {
                    closeDisconnectError();
                    console.log('Connect');
                    ws.send('N2O,'+transition.pid);
                    active=true; }
            };
            clearInterval(timerObj["ws_funcs"]);
        }else if(cnt > 300) {
            clearInterval(timerObj["ws_funcs"]);
        }
        cnt++;
    },100);
})();


/**
 *  Функция должна устанавливаться если соединение по ws востановлено.
 *  Уберает грейскале и сообщение о ошибке соединения.
 */
function closeDisconnectError() {
    var alert = document.getElementById("alertMsg");
    if(alert) { alert.parentNode.removeChild(alert); }
    grayscaleElement(".app",0);
}

/**
 *  Функция показа ошибки в случае падения ws.
 *  Делает все серым цветом и показывает сообщение об ошибке
 */
function showDisconnectError() {
    var step = 1;
    var grayscale = setInterval(function() {
        grayscaleElement(".app",step);
        step++;
        if(step > 100) {
            clearInterval(grayscale);
        }
    }, 1);
    var msg = i18n("Disconnect");
    initAlertMsg(msg,"center");
}
/**
 *************************************************************
 ****************** END WS connection funcs ******************
 *************************************************************
 */


