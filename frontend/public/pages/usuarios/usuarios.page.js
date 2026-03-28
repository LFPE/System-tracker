export function createAdminModule({ S, api, showToast, closeModal }) {
  async function renderUsers() {
    const el = document.getElementById('users-tbody');
    if (!el) return;

    if (S.user?.role !== 'admin') {
      el.innerHTML = '<tr class="table-empty-row"><td colspan="4">Apenas administradores podem gerenciar usu\u00e1rios.</td></tr>';
      return;
    }

    try {
      const d = await api.get('/users');
      el.innerHTML = d.users.map(u => `
        <tr>
          <td><code class="user-login-badge">${u.login}</code></td>
          <td>${u.name}</td>
          <td class="cell-center"><span class="tag ${u.role === 'admin' ? 'tag-rev' : 'tag-trat'}">${u.role}</span></td>
          <td class="cell-center">
            ${u.login !== 'admin'
              ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id},'${u.login}')">Remover</button>`
              : '<span class="cell-placeholder">\u2014</span>'}
          </td>
        </tr>`).join('');
    } catch (e) {
      showToast(e.message, 'err');
    }
  }

  function openAddUser() {
    ['m-login', 'm-name', 'm-pass'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('m-role').value = 'user';
    document.getElementById('user-modal').classList.add('open');
  }

  async function saveUser() {
    const login = document.getElementById('m-login').value.trim();
    const name = document.getElementById('m-name').value.trim();
    const pass = document.getElementById('m-pass').value;
    const role = document.getElementById('m-role').value;
    if (!login || !name || !pass) {
      showToast('Preencha todos os campos', 'warn');
      return;
    }

    try {
      await api.post('/users', { login, name, pass, role });
      closeModal();
      renderUsers();
      showToast('Usu\u00e1rio criado!');
    } catch (e) {
      showToast(e.message, 'err');
    }
  }

  async function deleteUser(id, login) {
    if (!window.confirm(`Remover usu\u00e1rio "${login}"?`)) return;
    try {
      await api.del(`/users/${id}`);
      renderUsers();
      showToast('Usu\u00e1rio removido.');
    } catch (e) {
      showToast(e.message, 'err');
    }
  }

  return {
    renderUsers,
    openAddUser,
    saveUser,
    deleteUser,
  };
}