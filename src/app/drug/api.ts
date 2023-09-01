import axios from 'axios';
import { FullDrugInfo, SearchResult } from '../../drug-types';

const SERVER_BASE_PATH = import.meta.env.VITE_SERVER_URL;

export async function searchDrugs(query: string): Promise<SearchResult> {
  const response = await axios.get(`${SERVER_BASE_PATH}api/drug/search`, {
    params: {
      q: query,
    },
  });
  return response.data;
}

export async function getDrug(drugId: string): Promise<FullDrugInfo> {
  const response = await axios.get(`${SERVER_BASE_PATH}api/drug/${drugId}`);
  return response.data;
}
