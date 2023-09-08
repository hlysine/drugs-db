import axios from 'axios';
import { FullDrugInfo, SearchResult, WikiPage } from '../../drug-types';

const SERVER_BASE_PATH = import.meta.env.VITE_SERVER_URL;

export async function searchDrugs(
  query: string,
  limit = 20,
  skip = 0
): Promise<SearchResult> {
  const response = await axios.get(`${SERVER_BASE_PATH}api/drug/search`, {
    params: {
      q: query,
      limit,
      skip,
    },
  });
  return response.data;
}

export async function getDrug(drugId: string): Promise<FullDrugInfo> {
  const response = await axios.get(`${SERVER_BASE_PATH}api/drug/${drugId}`);
  return response.data;
}

export function getSearchLink(query: string) {
  return `https://google.com/search?q=${encodeURIComponent(query)}`;
}

export async function searchWiki(query: string): Promise<WikiPage | null> {
  const response = await axios.get(`${SERVER_BASE_PATH}api/drug/wiki`, {
    params: {
      q: query,
    },
  });
  return response.data;
}
