import { ipcRenderer } from 'electron';

let user = <HTMLInputElement>document.getElementById('user');
let pass = <HTMLInputElement>document.getElementById('pass');
let loginBtn = <HTMLButtonElement>document.getElementById('login-btn');
let loginAlert = <HTMLDivElement>document.querySelector('.login-alert');
let loginAlertTimeout: NodeJS.Timeout;
(function() {
  function fn(event: KeyboardEvent) {
    if (event.keyCode !== 13) return;
    event.preventDefault();
    loginBtn.click();
  }
  user.addEventListener('keyup', fn);
  pass.addEventListener('keyup', fn);
})();

(function() {
  function fn(msg: string) {
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
      if (!pass.value) fn('username and password are empty!');
      else fn('username empty!');
      return;
    } else if (!pass.value) {
      fn('password empty!');
      return;
    }
    ipcRenderer.send(
      'query', // channel
      `select type from users where user='${user.value}' and pass='${pass.value}';`,
      'login' // return channel
    );
  };

  ipcRenderer.on('login', (_ev, msg: string) => fn(msg));
})();
