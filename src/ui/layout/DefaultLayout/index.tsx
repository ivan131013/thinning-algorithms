import { Container } from "@chakra-ui/react";
import { FunctionComponent } from "react";

interface DefaultLayoutProps {
  children?: string | React.ReactNode | React.ReactNode[];
}

const DefaultLayout: FunctionComponent<DefaultLayoutProps> = ({ children }) => {
  return <Container minW={'95vw'} pt={'4rem'} mb={'5rem'}>{children}</Container>;
};

export default DefaultLayout;
