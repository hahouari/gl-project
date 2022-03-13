"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let idInput = document.getElementById('id');
let fname = document.getElementById('fname');
let lname = document.getElementById('lname');
let adresse = document.getElementById('adresse');
let registerBtn = document.getElementById('register-btn');
let registerAlert = document.getElementById('register-alert');
let registerAlertTimeout;
electron_1.ipcRenderer.on('client-id', (_ev, clientID) => {
    idInput.value = clientID;
});
(function () {
    function fn(event) {
        if (event.keyCode !== 13)
            return;
        event.preventDefault();
        registerBtn.click();
    }
    fname.addEventListener('keyup', fn);
    lname.addEventListener('keyup', fn);
    adresse.addEventListener('keyup', fn);
})();
(function () {
    function fn(msg) {
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
                if (!adresse.value)
                    fn('Nom, prénom et adresse sont vides!');
                else
                    fn('Nom et prénom sont vides!');
            }
            else {
                if (!adresse.value)
                    fn('Nom et adresse sont vides!');
                else
                    fn('Nom est vide!');
            }
            return;
        }
        else {
            if (!lname.value) {
                if (!adresse.value)
                    fn('Prénom et adresse sont vides!');
                else
                    fn('Prénom est vide!');
            }
            else {
                if (!adresse.value)
                    fn('adresse est vide!');
                else {
                    electron_1.ipcRenderer.send('update', `insert into T_Client values(${idInput.value}, '${fname.value}', '${lname.value}', 'g1')`, 'register');
                }
            }
        }
    };
})();
//# sourceMappingURL=renderer.js.map