// src/ViewHistory.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

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

const Content = styled.pre`
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 1em;
`;

const ViewHistory = () => {
  const { filename } = useParams();
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/view_history/${filename}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          setContent(`Error: ${data.error}`);
        } else {
          setContent(data.content);
        }
      })
      .catch((error) => setContent(`Fetch error: ${error}`));
  }, [filename]);

  return (
    <Container>
      <Title>{filename}</Title>
      <Content>{content}</Content>
    </Container>
  );
};

export default ViewHistory;
