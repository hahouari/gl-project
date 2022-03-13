"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let user = document.getElementById('user');
let pass = document.getElementById('pass');
let loginBtn = document.getElementById('login-btn');
let loginAlert = document.querySelector('.login-alert');
let loginAlertTimeout;
(function () {
    function fn(event) {
        if (event.keyCode !== 13)
            return;
        event.preventDefault();
        loginBtn.click();
    }
    user.addEventListener('keyup', fn);
    pass.addEventListener('keyup', fn);
})();
(function () {
    function fn(msg) {
        clearTimeout(loginAlertTimeout);
        loginAlert.innerText = msg;
        loginAlert.classList.add('alert-danger');
        loginAlertTimeout = setTimeout(() => {
            loginAlert.innerText = '';
            loginAlert.classList.remove('alert-danger');
        }, 3000);
    }
    loginBtn.onclick = () => {
        if (!user.value) {
            if (!pass.value)
                fn('username and password are empty!');
            else
                fn('username empty!');
            return;
        }
        else if (!pass.value) {
            fn('password empty!');
            return;
        }
        electron_1.ipcRenderer.send('query', `select type from users where user='${user.value}' and pass='${pass.value}';`, 'login');
    };
    electron_1.ipcRenderer.on('login', (_ev, msg) => fn(msg));
})();
//# sourceMappingURL=renderer.js.map