import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "antd/dist/reset.css"; // make sure this is here

import store from "./redux/store";
import App from "./App.jsx";
import GlobalMessageProvider from "./components/GlobalMessageProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <GlobalMessageProvider>
          <App />
        </GlobalMessageProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
