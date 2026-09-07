/**
 * auth.js - Autenticação simples do painel admin
 */
const Auth = {
  isLoggedIn() {
    return sessionStorage.getItem('admin_logged') === 'true';
  },

  async login(password) {
    try {
      const config = await Storage.getConfig();
      if (password === (config.adminPassword || 'admin123')) {
        sessionStorage.setItem('admin_logged', 'true');
        sessionStorage.setItem('admin_login_time', new Date().toISOString());
        return true;
      }
      return false;
    } catch (e) {
      console.error('Erro login', e);
      if (password === 'admin123') {
        sessionStorage.setItem('admin_logged', 'true');
        return true;
      }
      return false;
    }
  },

  logout() {
    sessionStorage.removeItem('admin_logged');
    sessionStorage.removeItem('admin_login_time');
    window.location.href = 'login.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
};
window.Auth = Auth;
