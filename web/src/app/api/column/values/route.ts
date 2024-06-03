import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { DocumentSchema, SolrSearchBaseResponse } from "../../search/route";

export type SolrFacetResponse = SolrSearchBaseResponse & {
  facet_counts: {
    facet_queries: {},
      facet_fields: FacetFieldResponse,
      facet_ranges: {},
      facet_intervals: {},
      facet_heatmaps: {}
  }
}

type FacetFieldResponse = Record<keyof DocumentSchema, Array<keyof DocumentSchema | number>>

export type SearchColumnValuesResponse = Record<keyof DocumentSchema, Record<keyof DocumentSchema, number>>

type Test = keyof DocumentSchema;
let test: Test;


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  try {
    const res = await axios.get<SolrFacetResponse>('http://localhost:8983/solr/new_core/select', {
      params:searchParams
    });
    
    const response = Object.entries(res.data.facet_counts.facet_fields).reduce((map: SearchColumnValuesResponse, [column, stringArray]) => {
      for(let i=0; i<stringArray.length; i+=2) {
        if (!map[column as keyof DocumentSchema]) {
          map[column as keyof DocumentSchema] = {} as any
        }
        const value = stringArray[i];
        const documentCount = stringArray[i+1] as number;
        map[column as keyof DocumentSchema][value as keyof DocumentSchema] = documentCount;
      }
      return map;
    }, {} as SearchColumnValuesResponse)
    return NextResponse.json(response, {status: 200});
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      throw error
    }
  }
}