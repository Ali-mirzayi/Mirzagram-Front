import * as SQLite from 'expo-sqlite';
import { Room } from "./types";

export const getDBConnection = () => {
  return SQLite.openDatabaseAsync('db.db',{useNewConnection:true});
};

export const createTable = async () => {
  const db = await getDBConnection();
  await db.runAsync('PRAGMA journal_mode = WAL;');
  await db.runAsync('CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);').catch((error) => console.log(error, 'error creating table'));
};

export const insertRoom = async (room: Room) => {
  const db = await getDBConnection();
  await db.runAsync('INSERT OR IGNORE INTO rooms (id, data) VALUES (?, ?)', [JSON.stringify(room.id), JSON.stringify(room)]).catch((error) => console.log(error, 'error insertRoom table'));
};

export const updateMessage = async (data: Room) => {
  const db = await getDBConnection();
  await db.runAsync('UPDATE rooms SET data = ? WHERE id = ?', [JSON.stringify(data), JSON.stringify(data.id)])
};

export const getAllRooms = async () => {
  const db = await getDBConnection();
  return await db.getAllAsync<Room>('SELECT data FROM rooms');
};

export const getRoom = async (id: string) => {
  const db = await getDBConnection();
  return await db.getAllAsync<{data:string,id:string}>('SELECT data FROM rooms WHERE id = ?', [JSON.stringify(id)]);
};

export const deleteDB = async () => {
  const db = await getDBConnection();
  return await db.runAsync('DROP TABLE IF EXISTS rooms').catch((error) => console.log(error, 'error drop table'));
}