import { ChakraProvider } from "@chakra-ui/react";
import "./App.css";
import ThinningPage from "./pages/ThinningPage";
import "react-image-crop/dist/ReactCrop.css";
import { theme } from "./ui/theme/mainTheme";

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ThinningPage />
    </ChakraProvider>
  );
}

export default App;
