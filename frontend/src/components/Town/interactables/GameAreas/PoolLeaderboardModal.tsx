import { Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { Leader } from '../../../../poolLeaderboardServices/Leader';
import { PoolLeaderboardServiceClient } from '../../../../poolLeaderboardServices/PoolLeaderboardServiceClient';
/**
 * Returns a canvas that renders the pool game
 * @returns HTML canvas containing pool game display
 */
export default function PoolLeaderboard(): JSX.Element {
  const leaderboardService = new PoolLeaderboardServiceClient();
  const [leaderboard, setLeaderboard] = useState<Leader[]>([]);
  useEffect(() => {
    leaderboardService.leaderboard
      .listLeaderboard()
      .then(l => setLeaderboard(l.sort((a: Leader, b: Leader) => b.wins - a.wins)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
                <Tr key={leader.user_id}>
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
