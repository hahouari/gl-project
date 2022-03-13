import { ipcRenderer } from 'electron';

let idInput = <HTMLInputElement>document.getElementById('id-input');
let verifierBtn = <HTMLButtonElement>document.getElementById('verifier-btn');
let saveUser = <HTMLButtonElement>document.getElementById('save-user-btn');
let notifications = document.getElementsByClassName('notification');
let plcVideNum = <HTMLDivElement>document.getElementById('plc-vide-num');
let occPlcBtn = <HTMLButtonElement>document.getElementById('occ-plc-btn');
let modePayBtn = <HTMLButtonElement>document.getElementById('mode-pay-btn');
let occPlcNum = <HTMLSpanElement>document.getElementById('occ-plc-num');
let cancelSrv = <HTMLInputElement>document.getElementById('cancel-service');
let confirmSrv = <HTMLInputElement>document.getElementById('confirm-service');
let rgstdNote = <HTMLDivElement>document.getElementById('registered-note');
let qtInsrters = <HTMLDivElement[]>(
  Array.from(document.getElementsByClassName('quantity-inserter'))
);
let mins = <HTMLInputElement>document.getElementById('mins');
let hours = <HTMLInputElement>document.getElementById('hours');
let stock: object[];

let verificationTimeout: NodeJS.Timeout;
let plcOccupied = false;
let repReserved = false;

function notificationRemover(notification: HTMLDivElement) {
  clearTimeout(verificationTimeout);
  verificationTimeout = setTimeout(
    () => (notification.style.display = 'none'),
    4000
  );
}

(function() {
  function fn(event: KeyboardEvent, btn: HTMLButtonElement) {
    let input = <HTMLInputElement>event.target;
    if (input.value) {
      btn.classList.remove('disabled');
      btn.disabled = false;
    } else {
      btn.classList.add('disabled');
      btn.disabled = true;
    }
    if (event.keyCode !== 13) return;
    event.preventDefault();
    btn.click();
  }
  idInput.addEventListener('keyup', (ev: KeyboardEvent) => fn(ev, verifierBtn));
  // pass.addEventListener('keyup', fn);
})();

const verifierID = (actionAfter?: CallableFunction) => {
  if (idInput.value.match(/^[0-9]{4}$/)) {
    if (actionAfter) actionAfter();
    return false;
  } else {
    (<HTMLDivElement>notifications[1]).style.display = 'none';
    (<HTMLDivElement>notifications[2]).style.display = 'none';
    (<HTMLDivElement>notifications[0]).style.display = 'flex';

    occPlcBtn.classList.add('disabled');
    occPlcBtn.disabled = true;

    cancelSrv.disabled = true;
    cancelSrv.classList.add('disabled');
    notificationRemover(<HTMLDivElement>notifications[0]);
  }
};

verifierBtn.onclick = () =>
  verifierID(() => {
    ipcRenderer.send(
      'query', // channel
      `select * from T_Client where numClient=${idInput.value};`, // statement
      'verify-client' // return channel
    );
  });

saveUser.onclick = () =>
  verifierID(() => ipcRenderer.send('register-client', idInput.value));

ipcRenderer.on('verify-client', (_ev, ...infos: string[]) => {
  if (infos[0] == 'not-found') {
    (<HTMLDivElement>notifications[0]).style.display = 'none';
    (<HTMLDivElement>notifications[2]).style.display = 'none';
    (<HTMLDivElement>notifications[1]).style.display = 'flex';

    occPlcBtn.classList.add('disabled');
    occPlcBtn.disabled = true;
    cancelSrv.classList.add('disabled');
    cancelSrv.disabled = true;
  } else {
    idInput.disabled = true;
    verifierBtn.disabled = true;
    verifierBtn.classList.add('disabled');
    cancelSrv.disabled = false;
    cancelSrv.classList.remove('disabled');
    (<HTMLDivElement>(
      notifications[2].firstElementChild
    )).innerText = `Vérifié, Client ${infos[0]} ${infos[1]}.`;
    (<HTMLDivElement>notifications[0]).style.display = 'none';
    (<HTMLDivElement>notifications[2]).style.display = 'flex';
    (<HTMLDivElement>notifications[1]).style.display = 'none';

    if (<unknown>plcVideNum.innerHTML > 0) {
      occPlcBtn.classList.remove('disabled');
      occPlcBtn.disabled = false;
    } else {
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

occPlcBtn.onclick = () => ipcRenderer.send('occ-plc');

/****************************************************************************/

ipcRenderer.on('register', (_ev, infos) => {
  if (<unknown>plcVideNum.innerHTML > 0) {
    occPlcBtn.disabled = false;
    occPlcBtn.classList.remove('disabled');
    cancelSrv.disabled = false;
    cancelSrv.classList.remove('disabled');
    idInput.disabled = true;
    verifierBtn.disabled = true;
    verifierBtn.classList.add('disabled');
  } else {
    plcVideNum.style.color = '#da4c4c';
    plcVideNum.style.backgroundColor = 'orange';
    setTimeout(() => {
      plcVideNum.style.transition = 'background-color 1s ease-in-out';
      plcVideNum.style.backgroundColor = 'white';
    }, 0);
    setTimeout(() => (plcVideNum.style.transition = null), 1500);
  }

  (<HTMLDivElement>(
    notifications[2].firstElementChild
  )).innerText = `Enregistré, Client ${infos[0]} ${infos[1]}.`;

  (<HTMLDivElement>notifications[0]).style.display = 'none';
  (<HTMLDivElement>notifications[2]).style.display = 'flex';
  (<HTMLDivElement>notifications[1]).style.display = 'none';

  document.getElementById('reparation').classList.remove('disabled-tab');
});

ipcRenderer.on('plc-vide-num', (_ev, num: string) => {
  plcVideNum.innerHTML = num;
});

let resetServices = () => {
  idInput.value = '';
  idInput.disabled = false;
  verifierBtn.disabled = false;
  verifierBtn.classList.remove('disabled');
  (<HTMLDivElement>notifications[0]).style.display = 'none';
  (<HTMLDivElement>notifications[1]).style.display = 'none';
  (<HTMLDivElement>notifications[2]).style.display = 'none';

  (<HTMLAnchorElement>document.getElementById('parking-tab')).classList.remove(
    'disabled'
  );
  (<HTMLAnchorElement>(
    document.getElementById('reparation-tab')
  )).classList.remove('disabled');

  var srvType: string =
    Array.from(
      document.getElementsByClassName('tab-pane')
    ).filter((tab: HTMLDivElement) => tab.classList.contains('active'))[0].id ==
    'parking'
      ? 'Parking'
      : 'Reparation';

  if (srvType == 'Parking') {
    if (plcOccupied) {
      plcOccupied = false;
      ipcRenderer.send(
        'update',
        'update T_Place set occupee=0 where occupee=1 order by numPlace desc limit 1;',
        'uncopp-plc'
      );
    }
  } else {
    qtInsrters.forEach(
      (qtI: HTMLDivElement) =>
        ((<HTMLInputElement>qtI.children[1]).value = `${0}`)
    );
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
  ipcRenderer.send(
    'query',
    `select curdate() as curdate, curtime() as curtime, T_Garage.prixMainDoeuvre prix from T_Garage where T_Garage.id = 'g1';`,
    'register-service'
  );
};

ipcRenderer.on('register-service', (_ev, result: any[]) => {
  var randNum = Math.floor(Math.random() * 10000);
  var ttlPrice: number;

  var srvType: string =
    Array.from(
      document.getElementsByClassName('tab-pane')
    ).filter((tab: HTMLDivElement) => tab.classList.contains('active'))[0].id ==
    'parking'
      ? 'Parking'
      : 'Reparation';
  var curdate = (<string>result[0]?.['curdate'] || '').substr(0, 10);
  var curtime: string = result[0]['curtime'];
  var prixMainDoeuvre: number = result[0]['prix'];

  if (srvType == 'Parking') {
    ttlPrice = 4000;
  } else {
    repReserved = true;
    ttlPrice =
      qtInsrters.reduce((prvV, curV, curI) => {
        return (
          prvV +
          parseInt((<HTMLInputElement>curV.children[1]).value) *
            stock[curI]['prixUnitaire']
        );
      }, 0) +
      prixMainDoeuvre *
        (!hours.value
          ? 0
          : parseInt(hours.value) +
            (!mins.value ? 0 : parseInt(mins.value)) / 60);
  }

  var modePayQuery: string = `insert into T_ModePayment values(${
    modePayBtn.value == 'Immediate' ? "'oui', 'non'" : "'non', 'oui'"
  }, ${randNum})`;
  var srvQuery: string = `insert into T_Service values('srv-${curdate}-${curtime}-${idInput.value}', '${curdate}', ${randNum}  , '${idInput.value}', 'g1')`;
  var specSrvQuery: string;
  specSrvQuery = `insert into T_${srvType} values(${
    srvType == 'Parking'
      ? `100.0, ${occPlcNum.innerText}`
      : `${
          !hours.value
            ? 0
            : parseInt(hours.value) +
              (!mins.value ? 0 : parseInt(mins.value)) / 60
        }, ${ttlPrice}`
  }, 'srv-${curdate}-${curtime}-${idInput.value}')`;

  if (srvType == 'Parking') {
    ipcRenderer.send(
      'update',
      `${modePayQuery}; ${srvQuery}; ${specSrvQuery};`,
      'registered-service'
    );
  } else {
    let piecesQueries = stock.reduce(
      (prvV, curV, curI) =>
        parseInt((<HTMLInputElement>qtInsrters[curI].children[1]).value)
          ? `${prvV}update T_SortePieceDetache set quantiteDisponible=${curV[
              'quantiteDisponible'
            ] -
              parseInt(
                (<HTMLInputElement>qtInsrters[curI].children[1]).value
              )} where codeProduit=${
              curV['codeProduit']
            }; insert into T_SortePieceCommandee values(${parseInt(
              (<HTMLInputElement>qtInsrters[curI].children[1]).value
            )}, ${Math.floor(Math.random() * 1000000000)}, ${
              curV['codeProduit']
            }, 'srv-${curdate}-${curtime}-${idInput.value}');`
          : `${prvV}`,
      ''
    );

    ipcRenderer.send(
      'update',
      `${modePayQuery}; ${srvQuery}; ${specSrvQuery};${piecesQueries}`,
      'registered-service'
    );
  }

  document.getElementById('ttl-price').innerText = ttlPrice + 'DZA';
});

ipcRenderer.on('registered-service', () => {
  plcOccupied = false;
  rgstdNote.style.display = 'flex';
  resetServices();
  if (repReserved) {
    repReserved = false;
    ipcRenderer.send('pieces-infos');
  }
});

ipcRenderer.on(
  'uncopp-plc',
  () =>
    (plcVideNum.innerHTML = <any>(Number.parseInt(plcVideNum.innerHTML) + 1))
);

ipcRenderer.on('occ-plc-row', (_ev, row: string[] | string) => {
  plcVideNum.innerHTML = <any>(Number.parseInt(plcVideNum.innerHTML) - 1);
  plcOccupied = true;
  occPlcBtn.disabled = true;
  occPlcBtn.classList.add('disabled');
  occPlcNum.parentElement.style.display = 'block';
  occPlcNum.innerHTML = `${row[0]['numPlace']}`.padStart(4, '0');
  (<HTMLAnchorElement>document.getElementById('reparation-tab')).classList.add(
    'disabled'
  );

  modePayBtn.classList.remove('disabled');
  modePayBtn.disabled = false;
});

ipcRenderer.on('pieces-infos', (_ev, result: object[]) => {
  stock = result;
  Array.from(document.getElementsByClassName('piece')).forEach(
    (piece: HTMLSpanElement, index) => {
      if (result[index]['quantiteMin'] >= result[index]['quantiteDisponible'])
        piece.classList.add('badge-warning');
      else if (result[index]['quantiteDisponible'] == 0) {
        piece.classList.add('badge-danger');
      } else piece.classList.add('badge-primary');

      (<HTMLInputElement>qtInsrters[index].children[1]).max =
        result[index]['quantiteDisponible'];

      piece.innerText = result[index]['quantiteDisponible'];
    }
  );
});

$(function() {
  $('.dropdown-menu a').click(function() {
    $('.dropdown-btn:first-child').text($(this).text());
    $('.dropdown-btn:first-child').val($(this).text());
    confirmSrv.disabled = false;
    confirmSrv.classList.remove('disabled');
  });
});

ipcRenderer.send('plc-vide-num');
ipcRenderer.send('pieces-infos');
