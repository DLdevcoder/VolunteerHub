import { message } from "antd";
import { MessageContext } from "../utils/hooks/useGlobalMessage.js";

const GlobalMessageProvider = ({ children }) => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <MessageContext.Provider value={messageApi}>
      {contextHolder}
      {children}
    </MessageContext.Provider>
  );
};

export default GlobalMessageProvider;
