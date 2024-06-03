import axios from "axios";
import { appendFileSync, existsSync} from "fs";
import { NextRequest, NextResponse } from "next/server";

export type DocumentSchema = {
  Sentiment: Array<string>;
  Review: Array<string>;
  Types: string,
  Rating: string,
  RestaurantName: string,
  RestaurantRating: number,
  PriceLevel: number[]
  id: string;
  _version: number;
  Delivery: boolean[];
}

export type NormalizedDocumentSchema = Omit<DocumentSchema, 'Types' | 'PriceLevel' | 'Delivery'> & {
  Types: string[]
  PriceLevel: number,
  Delivery: boolean | null;
}

export type SolrSearchBaseResponse = {
  response: {
    numFound: number,
    start: number,
    numFoundExact: boolean,
    docs: Array<DocumentSchema>
  }
}

export type SearchResponse = {
  data: NormalizedDocumentSchema[]
  total: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  try {
    const res = await axios.get<SolrSearchBaseResponse>('http://localhost:8983/solr/new_core/select', {
      params:searchParams
    });
    // const fileExists = existsSync('query_log.json');
    // const log = JSON.stringify({ query: request.url, response: res.data});
    // let contentToAppend = log;
    // if (fileExists) {
    //   contentToAppend = ',' + '\n' + contentToAppend;
    // }
    // appendFileSync('query_log.json', contentToAppend)
    const response: SearchResponse = {
      data: res.data.response.docs.map((row) => ({
        ...row,
        Types: row.Types?.[0].split(', '),
        PriceLevel: row.PriceLevel ? row.PriceLevel[0] : -1,
        Delivery: row.Delivery ? row.Delivery[0] : null
      })),
      total: res.data.response.numFound,
    }
    return NextResponse.json(response, {status: 200});
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      throw error
    }
  }
}