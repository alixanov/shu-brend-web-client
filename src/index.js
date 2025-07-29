import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { SnackbarProvider } from "notistack";
import { ChakraProvider } from "@chakra-ui/react";

import { Routera } from "./router";
import { store } from "./context/store";
import { Loading } from "./components/loading/loading";

import "./assets/global.css";
import "./assets/modal.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <ChakraProvider>
      <Provider store={store}>
        <SnackbarProvider>
          <Loading />
          <Routera />
        </SnackbarProvider>
      </Provider>
    </ChakraProvider>
  </BrowserRouter>
);
