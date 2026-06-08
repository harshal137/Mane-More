import {createBrowserRouter, Outlet, RouterProvider, Navigate} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Menu from './components/Menu';
import Login from './pages/Login';
import Home from './pages/Home';
import Users from './pages/Users';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Banners from './pages/Banners';
import NewProduct from './pages/NewProduct';
import Product from './pages/Product';
import Bundles from './pages/Bundle';
import CreateBundle from './pages/NewBundle';
import Payments from './pages/Payments';
import Analytics from './pages/Analytics';
import AdminSettings from './pages/AdminSettings';
import OrderDetail from "./pages/OrderDetail";

function App () {
  const Layout = () => {
    return (
      <div className="admin-shell">
        <Menu />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    );
  };

  const router = createBrowserRouter ([
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/home" replace />,
        },
        {
          path: '/home',
          element: <Home />,
        },
        {
          path: '/users',
          element: <Users />,
        },
        {
          path: '/products',
          element: <Products />,
        },
        {
          path: '/orders',
          element: <Orders />,
        },
         {
          path: '/payments',
          element: <Payments />,
        },
        {
          path: '/bundles',
          element: <Bundles />,
        },
        {
          path: '/bundles/create',
          element: <CreateBundle />,
        },
        {
          path: '/banners',
          element: <Banners />,
        },
         {
          path: '/tracking',
          element: <Analytics />,
        },
        
        {
          path: '/settings',
          element: <AdminSettings />,
        },
        {
          path: '/newproduct',
          element: <NewProduct />,
        },
        {
          path: '/product/:id',
          element: <Product />,
        },
        {
          path: '/order/:id',
          element: <OrderDetail />,
        }
      ],
    },
  ]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
