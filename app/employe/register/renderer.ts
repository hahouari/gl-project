import { ipcRenderer } from 'electron';
let idInput = <HTMLInputElement>document.getElementById('id');
let fname = <HTMLInputElement>document.getElementById('fname');
let lname = <HTMLInputElement>document.getElementById('lname');
let adresse = <HTMLInputElement>document.getElementById('adresse');
let registerBtn = <HTMLButtonElement>document.getElementById('register-btn');
let registerAlert = <HTMLDivElement>document.getElementById('register-alert');
let registerAlertTimeout: NodeJS.Timeout;

ipcRenderer.on('client-id', (_ev, clientID: string) => {
  idInput.value = clientID;
});

(function() {
  function fn(event: KeyboardEvent) {
    if (event.keyCode !== 13) return;
    event.preventDefault();
    registerBtn.click();
  }
  fname.addEventListener('keyup', fn);
  lname.addEventListener('keyup', fn);
  adresse.addEventListener('keyup', fn);
})();

(function() {
  function fn(msg: string) {
    clearTimeout(registerAlertTimeout);
    registerAlert.innerText = msg;
    registerAlert.classList.add('alert-danger');
    registerAlertTimeout = setTimeout(() => {
      registerAlert.innerText = '';
      registerAlert.classList.remove('alert-danger');
    }, 3000);
  }

  registerBtn.onclick = () => {
    if (!fname.value) {
      if (!lname.value) {
        if (!adresse.value) fn('Nom, prénom et adresse sont vides!');
        else fn('Nom et prénom sont vides!');
      } else {
        if (!adresse.value) fn('Nom et adresse sont vides!');
        else fn('Nom est vide!');
      }
      return;
    } else {
      if (!lname.value) {
        if (!adresse.value) fn('Prénom et adresse sont vides!');
        else fn('Prénom est vide!');
      } else {
        if (!adresse.value) fn('adresse est vide!');
        else {
          ipcRenderer.send(
            'update', // channel
            `insert into T_Client values(${idInput.value}, '${fname.value}', '${lname.value}', 'g1')`, // statement
            'register' // return channel
          );
        }
      }
    }
  };
})();
