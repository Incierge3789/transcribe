import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import io from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GlobalStyle, Container, Header, Nav, NavLink, Title, Content, SummarySection, ResponseSection, SectionTitle, Text, KeyPoints, RealTimeSection, SettingsContainer } from './styles';
import Settings from './Settings';
import History from './History';  
import ViewHistory from './ViewHistory';  
import styled from 'styled-components';
import axios from 'axios';

const FixedBottom = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: white;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: center;
  padding: 10px;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
`;

const Button = styled.button`
  padding: 10px 20px;
  font-size: 1em;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  Margin: 0 10px; /* ボタン間のスペース */

  &:hover {
    background-color: #005bb5;
  }
`;

const App = () => {
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState([]);
  const [response, setResponse] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);  

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL);

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('transcription', (data) => {
      setTranscription((prev) => `${prev}\n${data.data}`);
    });

    socket.on('summary', (data) => {
      setSummary(data.data);
    });

    socket.on('response', (data) => {
      setResponse(data.data);
    });

    socket.on('keyPoints', (data) => {
      setKeyPoints(data.data);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const handleSaveSettings = (settings) => {
    console.log('Settings saved:', settings);
    // ここで設定を保存する処理を追加
  };

  const startRecording = () => {
    axios.post(`${process.env.REACT_APP_API_URL}/start_recording`)
      .then(() => {
        toast.success('録音を開始しました');
      })
      .catch((error) => {
        toast.error('録音の開始に失敗しました');
        console.error(error);
      });
  };

  const stopRecording = () => {
    axios.post(`${process.env.REACT_APP_API_URL}/stop_recording`)
      .then(() => {
        toast.success('録音を停止しました');
      })
      .catch((error) => {
        toast.error('録音の停止に失敗しました');
        console.error(error);
      });
  };

  return (
    <Router>
      <GlobalStyle />
      <Container>
        <Header>
          <Title>リアルタイム音声要約</Title>
          <Nav>
            <NavLink as={Link} to="/">ホーム</NavLink>
            <NavLink as={Link} onClick={toggleSettings}>設定</NavLink>
            <NavLink as={Link} onClick={toggleHistory}>履歴</NavLink> {/* 履歴リンクの更新 */}
          </Nav>
        </Header>
        {isSettingsOpen && (
          <SettingsContainer>
            <Settings onSave={handleSaveSettings} onClose={toggleSettings} />
          </SettingsContainer>
        )}
        {isHistoryOpen && (
          <SettingsContainer>  {/* 同じスタイルを使用 */}
            <History onClose={toggleHistory} />
          </SettingsContainer>
        )}
        <Content>
          <SummarySection>
            <SectionTitle>要約</SectionTitle>
            <KeyPoints>
              {keyPoints.map((point, index) => (
                <Text key={index}>{point}</Text>
              ))}
            </KeyPoints>
            <Text>{summary}</Text>
          </SummarySection>
          <ResponseSection>
            <SectionTitle>客観的な回答</SectionTitle>
            <Text>{response}</Text>
          </ResponseSection>
        </Content>
        <RealTimeSection>
          <SectionTitle>リアルタイム文字起こし</SectionTitle>
          <Text>{transcription}</Text>
        </RealTimeSection>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history/:filename" element={<ViewHistory />} />  
        </Routes>
        <FixedBottom>
          <Button onClick={startRecording}>録音開始</Button>
          <Button onClick={stopRecording}>録音停止</Button>
        </FixedBottom>
      </Container>
      <ToastContainer />
    </Router>
  );
};

const Home = () => <div />;

export default App;
