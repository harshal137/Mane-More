import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import Myaccount from "./pages/Myaccount";
import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
import Announcement from "./components/Announcement";
import AnalyticsProvider from "./components/AnalyticsProvider";
import Product from "./pages/Product";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductList from "./pages/ProductList";
import Order from "./pages/Order";
import { useDispatch, useSelector } from "react-redux";
import ScrollToTop from "./components/ScrollToTop";
import Wishlist from "./pages/Wishlist";
import Error from "./pages/Error";
import { useEffect } from "react";
import { userRequest } from "./requestMethods";
import { logOut } from "./redux/userRedux";

/** Defines the storefront route tree and application-wide layout. */
function App() {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    const validateUserSession = async () => {
      if (!user?.currentUser) return;

      try {
        await userRequest.get("/auth/me");
      } catch (error) {
        if (cancelled || error.response?.status !== 401) return;

        dispatch(logOut());
        localStorage.removeItem("currentUser");
        localStorage.removeItem("token");
      }
    };

    validateUserSession();
    const interval = setInterval(validateUserSession, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [dispatch, user?.currentUser]);
  
  const Layout = () => {
    return (
      <AnalyticsProvider> {/* Move AnalyticsProvider here */}
        <div>
          <ScrollToTop />
          <Navbar />
          <Outlet />
          <Footer />
        </div>
      </AnalyticsProvider>
    );
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "*",
          element: <Error />,
        },
        {
          path: "/",
          element: <Home />,
        },
        {
          path: "/cart",
          element: <Cart />,
        },
        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/create-account",
          element: <Register />,
        },
        {
          path: "/wishlist",
          element: <Wishlist />,
        },
        {
          path: "/myaccount",
          element: user?.currentUser ? <Myaccount /> : <Home />,
        },
        {
          path: "/product/:productId",
          element: <Product />,
        },
        
        {
          path: "/products/:searchterm",
          element: <ProductList />,
        },
        {
          path: "/myorders",
          element: user?.currentUser ? <Order /> : <Login />,
        },
      ],
    },
  ]);
  
  return (
    <RouterProvider router={router} />
  );
}

export default App;
