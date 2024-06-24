import React, { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const Container = styled.div`
  padding: 20px;
  background-color: #f7f7f7;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 1.8em;
  margin-bottom: 20px;
  color: #333;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 10px;
  font-size: 1.2em;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  font-size: 1em;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
`;

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
  margin: 0 10px; /* ボタン間のスペース */

  &:hover {
    background-color: #005bb5;
  }
`;

const Settings = ({ onSave }) => {
  const [summaryInterval, setSummaryInterval] = useState(60);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ summaryInterval });
    toast.success('設定が保存されました');
  };

  const startRecording = () => {
    axios.post('http://localhost:3001/start_recording')
      .then(() => {
        toast.success('録音を開始しました');
      })
      .catch((error) => {
        toast.error('録音の開始に失敗しました');
        console.error(error);
      });
  };

  const stopRecording = () => {
    axios.post('http://localhost:3001/stop_recording')
      .then(() => {
        toast.success('録音を停止しました');
      })
      .catch((error) => {
        toast.error('録音の停止に失敗しました');
        console.error(error);
      });
  };

  return (
    <Container>
      <Title>設定</Title>
      <form onSubmit={handleSubmit}>
        <Label htmlFor="summaryInterval">要約間隔 (秒):</Label>
        <Input
          id="summaryInterval"
          type="number"
          value={summaryInterval}
          onChange={(e) => setSummaryInterval(e.target.value)}
        />
        <Button type="submit">保存</Button>
      </form>
      <FixedBottom>
        <Button onClick={startRecording}>録音開始</Button>
        <Button onClick={stopRecording}>録音停止</Button>
      </FixedBottom>
    </Container>
  );
};

export default Settings;
