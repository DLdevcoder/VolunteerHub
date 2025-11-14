import "./App.css";
import LoginForm from "./components/LoginForm/LoginForm.jsx";
import RegisterForm from "./components/RegisterForm/RegisterForm.jsx";
import { Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
      </Routes>
    </div>
  );
};

export default App;
