import React, { useState, useEffect } from 'react';
import './styles/global.scss';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  last_seen: string;
  banned?: boolean;
}

interface Stats {
  total_users: number;
  total_chats: number;
  total_messages: number;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8081/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8081/admin/users');
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;

    try {
      await fetch(`http://localhost:8081/admin/users/${userId}/ban`, {
        method: 'POST',
      });
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <span>🔐</span>
          Fluxenite Admin
        </div>
        <ul className="nav-menu">
          <li>
            <a href="#" className="active">
              <i>📊</i> Dashboard
            </a>
          </li>
          <li>
            <a href="#">
              <i>👥</i> Users
            </a>
          </li>
          <li>
            <a href="#">
              <i>💬</i> Chats
            </a>
          </li>
          <li>
            <a href="#">
              <i>⚙️</i> Settings
            </a>
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="header">
          <h1>Dashboard</h1>
          <div className="user-info">
            <span>Admin</span>
            <div className="avatar" />
          </div>
        </header>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon primary">👥</div>
              <div className="stat-value">{stats.total_users}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">💬</div>
              <div className="stat-value">{stats.total_chats}</div>
              <div className="stat-label">Total Chats</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">📨</div>
              <div className="stat-value">{stats.total_messages}</div>
              <div className="stat-label">Total Messages</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon info">📈</div>
              <div className="stat-value">Active</div>
              <div className="stat-label">System Status</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2>User Management</h2>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Created</th>
                    <th>Last Seen</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {user.avatar_url && (
                            <img
                              src={user.avatar_url}
                              alt={user.username}
                              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                            />
                          )}
                          {user.username}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>{new Date(user.last_seen).toLocaleString()}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            user.banned ? 'banned' : 'active'
                          }`}
                        >
                          {user.banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSelectedUser(user)}
                        >
                          View
                        </button>
                        {!user.banned && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleBanUser(user.id)}
                            style={{ marginLeft: '0.5rem' }}
                          >
                            Ban
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>ID</label>
                <input type="text" value={selectedUser.id} readOnly />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={selectedUser.username} readOnly />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={selectedUser.email} readOnly />
              </div>
              <div className="form-group">
                <label>Created At</label>
                <input
                  type="text"
                  value={new Date(selectedUser.created_at).toLocaleString()}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Last Seen</label>
                <input
                  type="text"
                  value={new Date(selectedUser.last_seen).toLocaleString()}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <input
                  type="text"
                  value={selectedUser.banned ? 'Banned' : 'Active'}
                  readOnly
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
              {!selectedUser.banned && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleBanUser(selectedUser.id)}
                >
                  Ban User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
