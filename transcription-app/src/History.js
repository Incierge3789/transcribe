// src/History.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
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

const List = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const ListItem = styled.li`
  margin-bottom: 10px;
`;

const StyledLink = styled(Link)`
  color: #007aff;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const History = () => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3001/history')
      .then((response) => {
        if (response.data.files) {
          setFiles(response.data.files);
        } else {
          setError('No files found');
        }
      })
      .catch((error) => {
        console.error('Error fetching history:', error);
        setError('Error fetching history');
      });
  }, []);

  return (
    <Container>
      <Title>履歴</Title>
      {error && <p>{error}</p>}
      <List>
        {files.map((file, index) => (
          <ListItem key={index}>
            <StyledLink to={`/history/${file}`}>{file}</StyledLink>
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default History;
