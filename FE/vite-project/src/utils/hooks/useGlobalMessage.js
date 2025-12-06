import { useContext } from "react";
import { createContext } from "react";

export const MessageContext = createContext(null);

const useGlobalMessage = () => {
  return useContext(MessageContext);
};

export default useGlobalMessage;
