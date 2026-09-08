/**
 * app.js - Utilitários comuns da interface
 */

const App = {
  // Toast notifications
  toast(message, type = 'info', duration = 3500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Formatar data
  formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Formatar telefone
  formatPhone(tel) {
    if (!tel) return '—';
    return tel.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
  },

  // Modal helpers
  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  },

  // Confirmar acção
  confirm(message) {
    return window.confirm(message);
  },

  // Copiar para clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.toast('Copiado!', 'success');
      return true;
    } catch (e) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.toast('Copiado!', 'success');
      return true;
    }
  },


  // Aplicar logo da loja no ícone B do menu
  applyLogo(logoUrl) {
    document.querySelectorAll('.sidebar-header .logo, .logo-big').forEach(el => {
      if (logoUrl) {
        el.style.backgroundImage = `url(${logoUrl})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.textContent = '';
        el.classList.add('has-logo');
      } else {
        el.style.backgroundImage = '';
        el.classList.remove('has-logo');
        if (!el.textContent.trim()) el.textContent = 'B';
      }
    });
  },

  async loadAndApplyLogo() {
    try {
      if (typeof Storage === 'undefined' || !Storage.getConfig) return;
      const cfg = await Storage.getConfig();
      if (cfg && cfg.logoUrl) this.applyLogo(cfg.logoUrl);
    } catch (e) { /* silencioso */ }
  },
  // Sidebar mobile
  initSidebar() {
    const toggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('show');
    });
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  },

  // Destacar item activo no menu
  setActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  },

  // Escape HTML
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Link da roleta
  getRoletaUrl(token) {
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
    return `${base}roleta.html?token=${token}`;
  },

  // WhatsApp share
  shareWhatsApp(token, clienteNome) {
    const url = this.getRoletaUrl(token);
    const text = encodeURIComponent(
      `Olá ${clienteNome}! 🎉\n\nParabéns! Cumpriu as condições e pode girar a roleta de prémios da loja.\n\nClique no link abaixo para participar:\n${url}\n\nBoa sorte!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }
};

window.App = App;

// Inicializar sidebar em todas as páginas admin
document.addEventListener('DOMContentLoaded', () => {
  App.initSidebar();
  // Aguardar scripts de storage se existirem
  setTimeout(() => App.loadAndApplyLogo(), 300);
});
