import {
  ListItem,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  UnorderedList,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface Leader {
  id: string;
  name: string;
  wins: number;
}
/**
 * Returns a canvas that renders the pool game
 * @returns HTML canvas containing pool game display
 */
export default function PoolLeaderboard(): JSX.Element {
  const url = 'https://group-207-fp-database.herokuapp.com/';
  const [leaderboard, setLeaderboard] = useState([{ id: 0, name: 'test', wins: 10 }]);
  useEffect(() => {
    axios(url + 'leaderboard').then(response => {
      setLeaderboard(response.data.sort((a: Leader, b: Leader) => b.wins - a.wins));
    });
  }, [leaderboard]);
  return (
    <div id='pool-leaderboard'>
      <TableContainer>
        <Table variant='simple'>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Wins</Th>
            </Tr>
          </Thead>
          {
            <Tbody>
              {leaderboard?.map(leader => (
                <Tr key={leader.id}>
                  <Td role='cell'>{leader.name}</Td>
                  <Td role='cell'>{leader.wins}</Td>
                </Tr>
              ))}
            </Tbody>
          }
        </Table>
      </TableContainer>
    </div>
  );
}
