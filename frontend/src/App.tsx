import LandingPage from "./pages/landing-page";
import HowItWorksPage from "./pages/how-to-play";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Root from "./RootPage";

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
         <Route index element={<LandingPage />} />
         <Route path="/howitworks" element={<HowItWorksPage/>}/>
      </Route>
    )
  );
  return (
    <div>
       <RouterProvider router={router} />
    </div>
  )
}

export default App
