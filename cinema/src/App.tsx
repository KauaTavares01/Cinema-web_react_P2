import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from 'react-router-dom';

import './App.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';

import Filmes from './pages/Filmes';
import Salas from './pages/Salas';
import Sessoes from './pages/Sessoes';
import CadastroFilmes from './pages/CadastroFilmes';
import AdminDashboard from './contexts/AdminDashboard';
import ClienteDashboard from './contexts/ClienteDashboard';
import ComprarIngresso from './pages/ComprarIngresso';
import Login from './contexts/Login';
import Lanches from './pages/Lanches';

import ProtectedRoute from './components/ProtectedRoute';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          CineWeb
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Alternar navegação"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {/* Visitante (não logado) */}
            {!user && (
              <li className="nav-item">
                <Link className="nav-link" to="/filmes">
                  Filmes
                </Link>
              </li>
            )}

            {/* ADMIN */}
            {user?.role === 'admin' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin">
                    Painel Admin
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/filmes">
                    Filmes
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/salas">
                    Salas
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/sessoes">
                    Sessões
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/cadastro-filmes">
                    Cadastro de Filmes
                  </Link>
                </li>
                {/* 👇 NOVO: link para a página de lanches */}
                <li className="nav-item">
                  <Link className="nav-link" to="/admin/lanches">
                    Lanches
                  </Link>
                </li>
              </>
            )}

            {/* CLIENTE */}
            {user?.role === 'cliente' && (
              <li className="nav-item">
                <Link className="nav-link" to="/cliente">
                  Área do Cliente
                </Link>
              </li>
            )}
          </ul>

          <ul className="navbar-nav">
            {!user && (
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  Login
                </Link>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleLogout}
                >
                  Sair ({user.role})
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />

        <Routes>
          {/* Login como home */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* rota pública opcional */}
          <Route path="/filmes" element={<Filmes />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salas"
            element={
              <ProtectedRoute role="admin">
                <Salas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessoes"
            element={
              <ProtectedRoute role="admin">
                <Sessoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cadastro-filmes"
            element={
              <ProtectedRoute role="admin">
                <CadastroFilmes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lanches"
            element={
              <ProtectedRoute role="admin">
                <Lanches />
              </ProtectedRoute>
            }
          />

          {/* Cliente */}
          <Route
            path="/cliente"
            element={
              <ProtectedRoute role="cliente">
                <ClienteDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comprar-ingresso/:sessaoId"
            element={
              <ProtectedRoute role="cliente">
                <ComprarIngresso />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
