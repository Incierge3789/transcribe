import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f7f7f7;
  }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  min-height: 100vh;
`;

export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #007aff;
  padding: 10px 20px;
  color: white;
  border-radius: 10px;
  margin-bottom: 20px;
`;

export const Nav = styled.nav`
  display: flex;
  gap: 15px;
`;

export const NavLink = styled.a`
  color: white;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export const Title = styled.h1`
  font-size: 1.5em;
  margin: 0;
`;

export const Content = styled.div`
  display: flex;
  gap: 20px;
  flex-grow: 1;
`;

export const SummarySection = styled.section`
  flex: 1;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
`;

export const ResponseSection = styled(SummarySection)`
  margin-left: 20px;
`;

export const SectionTitle = styled.h2`
  font-size: 1.2em;
  margin-bottom: 10px;
  color: #333;
`;

export const Text = styled.p`
  font-size: 1em;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
`;

export const KeyPoints = styled.div`
  background-color: #eef;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  font-weight: bold;
  color: #333;
`;

export const RealTimeSection = styled(SummarySection)`
  margin-top: 20px;
`;

export const SettingsContainer = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;
