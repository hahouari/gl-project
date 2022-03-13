"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let idInput = document.getElementById('id-input');
let verifierBtn = document.getElementById('verifier-btn');
let saveUser = document.getElementById('save-user-btn');
let notifications = document.getElementsByClassName('notification');
let plcVideNum = document.getElementById('plc-vide-num');
let occPlcBtn = document.getElementById('occ-plc-btn');
let modePayBtn = document.getElementById('mode-pay-btn');
let occPlcNum = document.getElementById('occ-plc-num');
let cancelSrv = document.getElementById('cancel-service');
let confirmSrv = document.getElementById('confirm-service');
let rgstdNote = document.getElementById('registered-note');
let qtInsrters = (Array.from(document.getElementsByClassName('quantity-inserter')));
let mins = document.getElementById('mins');
let hours = document.getElementById('hours');
let stock;
let verificationTimeout;
let plcOccupied = false;
let repReserved = false;
function notificationRemover(notification) {
    clearTimeout(verificationTimeout);
    verificationTimeout = setTimeout(() => (notification.style.display = 'none'), 4000);
}
(function () {
    function fn(event, btn) {
        let input = event.target;
        if (input.value) {
            btn.classList.remove('disabled');
            btn.disabled = false;
        }
        else {
            btn.classList.add('disabled');
            btn.disabled = true;
        }
        if (event.keyCode !== 13)
            return;
        event.preventDefault();
        btn.click();
    }
    idInput.addEventListener('keyup', (ev) => fn(ev, verifierBtn));
})();
const verifierID = (actionAfter) => {
    if (idInput.value.match(/^[0-9]{4}$/)) {
        if (actionAfter)
            actionAfter();
        return false;
    }
    else {
        notifications[1].style.display = 'none';
        notifications[2].style.display = 'none';
        notifications[0].style.display = 'flex';
        occPlcBtn.classList.add('disabled');
        occPlcBtn.disabled = true;
        cancelSrv.disabled = true;
        cancelSrv.classList.add('disabled');
        notificationRemover(notifications[0]);
    }
};
verifierBtn.onclick = () => verifierID(() => {
    electron_1.ipcRenderer.send('query', `select * from T_Client where numClient=${idInput.value};`, 'verify-client');
});
saveUser.onclick = () => verifierID(() => electron_1.ipcRenderer.send('register-client', idInput.value));
electron_1.ipcRenderer.on('verify-client', (_ev, ...infos) => {
    if (infos[0] == 'not-found') {
        notifications[0].style.display = 'none';
        notifications[2].style.display = 'none';
        notifications[1].style.display = 'flex';
        occPlcBtn.classList.add('disabled');
        occPlcBtn.disabled = true;
        cancelSrv.classList.add('disabled');
        cancelSrv.disabled = true;
    }
    else {
        idInput.disabled = true;
        verifierBtn.disabled = true;
        verifierBtn.classList.add('disabled');
        cancelSrv.disabled = false;
        cancelSrv.classList.remove('disabled');
        (notifications[2].firstElementChild).innerText = `Vérifié, Client ${infos[0]} ${infos[1]}.`;
        notifications[0].style.display = 'none';
        notifications[2].style.display = 'flex';
        notifications[1].style.display = 'none';
        if (plcVideNum.innerHTML > 0) {
            occPlcBtn.classList.remove('disabled');
            occPlcBtn.disabled = false;
        }
        else {
            plcVideNum.style.color = '#da4c4c';
            plcVideNum.style.backgroundColor = 'orange';
            setTimeout(() => {
                plcVideNum.style.transition = 'background-color 1s ease-in-out';
                plcVideNum.style.backgroundColor = 'white';
            }, 0);
            setTimeout(() => (plcVideNum.style.transition = null), 1500);
        }
        document.getElementById('reparation').classList.remove('disabled-tab');
    }
});
occPlcBtn.onclick = () => electron_1.ipcRenderer.send('occ-plc');
electron_1.ipcRenderer.on('register', (_ev, infos) => {
    if (plcVideNum.innerHTML > 0) {
        occPlcBtn.disabled = false;
        occPlcBtn.classList.remove('disabled');
        cancelSrv.disabled = false;
        cancelSrv.classList.remove('disabled');
        idInput.disabled = true;
        verifierBtn.disabled = true;
        verifierBtn.classList.add('disabled');
    }
    else {
        plcVideNum.style.color = '#da4c4c';
        plcVideNum.style.backgroundColor = 'orange';
        setTimeout(() => {
            plcVideNum.style.transition = 'background-color 1s ease-in-out';
            plcVideNum.style.backgroundColor = 'white';
        }, 0);
        setTimeout(() => (plcVideNum.style.transition = null), 1500);
    }
    (notifications[2].firstElementChild).innerText = `Enregistré, Client ${infos[0]} ${infos[1]}.`;
    notifications[0].style.display = 'none';
    notifications[2].style.display = 'flex';
    notifications[1].style.display = 'none';
    document.getElementById('reparation').classList.remove('disabled-tab');
});
electron_1.ipcRenderer.on('plc-vide-num', (_ev, num) => {
    plcVideNum.innerHTML = num;
});
let resetServices = () => {
    idInput.value = '';
    idInput.disabled = false;
    verifierBtn.disabled = false;
    verifierBtn.classList.remove('disabled');
    notifications[0].style.display = 'none';
    notifications[1].style.display = 'none';
    notifications[2].style.display = 'none';
    document.getElementById('parking-tab').classList.remove('disabled');
    (document.getElementById('reparation-tab')).classList.remove('disabled');
    var srvType = Array.from(document.getElementsByClassName('tab-pane')).filter((tab) => tab.classList.contains('active'))[0].id ==
        'parking'
        ? 'Parking'
        : 'Reparation';
    if (srvType == 'Parking') {
        if (plcOccupied) {
            plcOccupied = false;
            electron_1.ipcRenderer.send('update', 'update T_Place set occupee=0 where occupee=1 order by numPlace desc limit 1;', 'uncopp-plc');
        }
    }
    else {
        qtInsrters.forEach((qtI) => (qtI.children[1].value = `${0}`));
        hours.value = '';
        mins.value = '';
        document.getElementById('reparation').classList.add('disabled-tab');
    }
    occPlcBtn.disabled = true;
    occPlcBtn.classList.add('disabled');
    occPlcNum.parentElement.style.display = 'none';
    modePayBtn.innerText = 'Méthode de Payement';
    modePayBtn.disabled = true;
    modePayBtn.classList.add('disabled');
    cancelSrv.disabled = true;
    cancelSrv.classList.add('disabled');
    confirmSrv.disabled = true;
    confirmSrv.classList.add('disabled');
};
cancelSrv.onclick = resetServices;
confirmSrv.onclick = () => {
    electron_1.ipcRenderer.send('query', `select curdate() as curdate, curtime() as curtime, T_Garage.prixMainDoeuvre prix from T_Garage where T_Garage.id = 'g1';`, 'register-service');
};
electron_1.ipcRenderer.on('register-service', (_ev, result) => {
    var _a;
    var randNum = Math.floor(Math.random() * 10000);
    var ttlPrice;
    var srvType = Array.from(document.getElementsByClassName('tab-pane')).filter((tab) => tab.classList.contains('active'))[0].id ==
        'parking'
        ? 'Parking'
        : 'Reparation';
    var curdate = (((_a = result[0]) === null || _a === void 0 ? void 0 : _a['curdate']) || '').substr(0, 10);
    var curtime = result[0]['curtime'];
    var prixMainDoeuvre = result[0]['prix'];
    if (srvType == 'Parking') {
        ttlPrice = 4000;
    }
    else {
        repReserved = true;
        ttlPrice =
            qtInsrters.reduce((prvV, curV, curI) => {
                return (prvV +
                    parseInt(curV.children[1].value) *
                        stock[curI]['prixUnitaire']);
            }, 0) +
                prixMainDoeuvre *
                    (!hours.value
                        ? 0
                        : parseInt(hours.value) +
                            (!mins.value ? 0 : parseInt(mins.value)) / 60);
    }
    var modePayQuery = `insert into T_ModePayment values(${modePayBtn.value == 'Immediate' ? "'oui', 'non'" : "'non', 'oui'"}, ${randNum})`;
    var srvQuery = `insert into T_Service values('srv-${curdate}-${curtime}-${idInput.value}', '${curdate}', ${randNum}  , '${idInput.value}', 'g1')`;
    var specSrvQuery;
    specSrvQuery = `insert into T_${srvType} values(${srvType == 'Parking'
        ? `100.0, ${occPlcNum.innerText}`
        : `${!hours.value
            ? 0
            : parseInt(hours.value) +
                (!mins.value ? 0 : parseInt(mins.value)) / 60}, ${ttlPrice}`}, 'srv-${curdate}-${curtime}-${idInput.value}')`;
    if (srvType == 'Parking') {
        electron_1.ipcRenderer.send('update', `${modePayQuery}; ${srvQuery}; ${specSrvQuery};`, 'registered-service');
    }
    else {
        let piecesQueries = stock.reduce((prvV, curV, curI) => parseInt(qtInsrters[curI].children[1].value)
            ? `${prvV}update T_SortePieceDetache set quantiteDisponible=${curV['quantiteDisponible'] -
                parseInt(qtInsrters[curI].children[1].value)} where codeProduit=${curV['codeProduit']}; insert into T_SortePieceCommandee values(${parseInt(qtInsrters[curI].children[1].value)}, ${Math.floor(Math.random() * 1000000000)}, ${curV['codeProduit']}, 'srv-${curdate}-${curtime}-${idInput.value}');`
            : `${prvV}`, '');
        electron_1.ipcRenderer.send('update', `${modePayQuery}; ${srvQuery}; ${specSrvQuery};${piecesQueries}`, 'registered-service');
    }
    document.getElementById('ttl-price').innerText = ttlPrice + 'DZA';
});
electron_1.ipcRenderer.on('registered-service', () => {
    plcOccupied = false;
    rgstdNote.style.display = 'flex';
    resetServices();
    if (repReserved) {
        repReserved = false;
        electron_1.ipcRenderer.send('pieces-infos');
    }
});
electron_1.ipcRenderer.on('uncopp-plc', () => (plcVideNum.innerHTML = (Number.parseInt(plcVideNum.innerHTML) + 1)));
electron_1.ipcRenderer.on('occ-plc-row', (_ev, row) => {
    plcVideNum.innerHTML = (Number.parseInt(plcVideNum.innerHTML) - 1);
    plcOccupied = true;
    occPlcBtn.disabled = true;
    occPlcBtn.classList.add('disabled');
    occPlcNum.parentElement.style.display = 'block';
    occPlcNum.innerHTML = `${row[0]['numPlace']}`.padStart(4, '0');
    document.getElementById('reparation-tab').classList.add('disabled');
    modePayBtn.classList.remove('disabled');
    modePayBtn.disabled = false;
});
electron_1.ipcRenderer.on('pieces-infos', (_ev, result) => {
    stock = result;
    Array.from(document.getElementsByClassName('piece')).forEach((piece, index) => {
        if (result[index]['quantiteMin'] >= result[index]['quantiteDisponible'])
            piece.classList.add('badge-warning');
        else if (result[index]['quantiteDisponible'] == 0) {
            piece.classList.add('badge-danger');
        }
        else
            piece.classList.add('badge-primary');
        qtInsrters[index].children[1].max =
            result[index]['quantiteDisponible'];
        piece.innerText = result[index]['quantiteDisponible'];
    });
});
$(function () {
    $('.dropdown-menu a').click(function () {
        $('.dropdown-btn:first-child').text($(this).text());
        $('.dropdown-btn:first-child').val($(this).text());
        confirmSrv.disabled = false;
        confirmSrv.classList.remove('disabled');
    });
});
electron_1.ipcRenderer.send('plc-vide-num');
electron_1.ipcRenderer.send('pieces-infos');
//# sourceMappingURL=renderer.js.map