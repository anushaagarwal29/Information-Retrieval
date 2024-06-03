"use client"

import { Form, List, Select, Spin, Switch, Table, TablePaginationConfig, TableProps } from "antd";
import Search from "antd/es/input/Search";
import { ColumnFilterItem, ColumnType, FilterValue, SelectionItem } from "antd/es/table/interface";
import axios from "axios";
import { useEffect, useState } from "react";
import { DocumentSchema, NormalizedDocumentSchema, SearchResponse } from "./api/search/route";
import { useTimedFunction } from "@/hooks/useTimedFunction";
import { useUserLocation } from "@/hooks/userUserLocation";
import { SearchColumnValuesResponse } from "./api/column/values/route";
import { DefaultOptionType } from "antd/es/select";

const baseColumns: Record<string, ColumnType<any>> = {
  RestaurantName: { 
    title: 'Restaurant',
    dataIndex: 'RestaurantName',
    key: 'RestaurantName',
    sorter: (a,b) => a.Review > b.Review as any,
    render: (text, record, index) => <p>{record.RestaurantName}</p>,
  },
  Review: { 
    title: 'Review',
    dataIndex: 'review',
    key: 'review',
    width: '100%',
    render: (text, record, index) => <p>{record.Review}</p>,
    sorter: (a,b) => a.Review > b.Review as any,
  },
  Rating: { 
    title: 'Rating',
    dataIndex: 'rating',
    key: 'rating',
    sorter: (a,b) => a.Rating-b.Rating,
    render: (text, record, index) => <p>{record.Rating}</p>,
  },
  RestaurantRating: { 
    title: 'Restaurant Rating',
    dataIndex: 'RestaurantRating',
    key: 'RestaurantRating',
    sorter: (a,b) => a.RestaurantRating-b.RestaurantRating,
    render: (text, record, index) => <p>{record.RestaurantRating}</p>,
  },
  LatLng: {
    title: 'Location',
    dataIndex: 'LatLng',
    key: 'LatLng',
    render: (text, record, index) => <p>{record.LatLng}</p>,
  },
  Types: {
    title: 'Types',
    dataIndex: 'Types',
    key: 'Types',
    render: (text, record, index) => <List>{record.Types.map((type: string) => <List.Item key={`${record.id}_${type}`}>{type}</List.Item>)}</List>,
  },
  FormattedAddress: {
    title: 'Address',
    dataIndex: 'Address',
    key: 'Address',
    render: (text, record, index) => <List>{record.FormattedAddress}</List>,
  },
  PriceLevel: {
    title: 'Price (1-5)',
    dataIndex: 'PriceLevel',
    key: 'PriceLevel',
    render: (text, record, index) => <List>{record.PriceLevel > -1 ? record.PriceLevel : 'No Data'}</List>,
    sorter: (a,b) => a.PriceLevel-b.PriceLevel,
  },
  Delivery: {
    title: 'Delivers',
    dataIndex: 'Delivery',
    key: 'Delivery',
    render: (text, record, index) => <List>{record.Delivery === null ? 'No Data' : record.Delivery ? 'Yes' : 'No'}</List>,
  },
}

type FilterColumn = keyof DocumentSchema
type Filters = Record<FilterColumn, { current: any, values: any[] | undefined }>;
const filterColumns: FilterColumn[] = ['Rating', 'RestaurantName', 'Types', 'PriceLevel', 'Delivery', 'RestaurantRating']


export default function Home() {
  const [data, setData] = useState<Array<NormalizedDocumentSchema>>();
  const [loading, setLoading] = useState(false);
  const [searchString, setSearchString] = useState('');
  const [columns, setColumns] = useState<TableProps['columns'] | null>(null);
  const [includeLocationBias, setIncludeLocationBias] = useState(false);
  const [tableParams, setTableParams] = useState<{ pagination: TablePaginationConfig, filters: Record<string, FilterValue | null> }>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {},
  });
  const [filters, setFilters] = useState<Filters>({} as any);
  const { location, error: locationError } = useUserLocation();

  const { executionTime, timedFunction: fetchData, resetExecutionTime} = useTimedFunction(async () => {
    setLoading(true);
    const params = new URLSearchParams();
  
    const topDocumentsNumber = 1000

    params.append('q', `"${searchString}"`);
    params.append('start', `${tableParams.pagination.current!-1}`);
    params.append('rows', `${topDocumentsNumber}`);
    params.append('spellcheck', 'true');
    params.append('useParams', 'dismax');
    if (includeLocationBias && location) {
      params.append('fq', '{!geofilt sfield=LatLng}');
      params.append('d', `50`);
      params.append('score', 'distance');
      params.append('pt', Object.values(location).join(','));
      params.append('bf', `recip(geodist(LatLng,${location.lat},${location.lng}),2,200,20)`)
      params.append('sort', 'score desc')
    }
    Object.entries(filters).forEach(([col, {current}])=>{
      if(current) {
        params.append('fq', `${col}="${current}"`)
      }
    })
    try {
      const { data: response } = await axios.get<SearchResponse>('/api/search', {
        params
      });
      setData(response.data);
      setLoading(false);
      setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            current: 1,
            total: Math.min(response.total, topDocumentsNumber),
          },
        });
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  });

  async function getDistinctValuesForColumns(columns: string[]) {
    // Native object doesn't work well for query param with repeated key: https://stackoverflow.com/questions/42898009/multiple-fields-with-same-key-in-query-params-axios-request
    const params = new URLSearchParams();
    params.append('q', '*:*');
    params.append('facet', 'true');
    columns.forEach((col) => {
      params.append('facet.field', col);
    })
    params.append('rows', '0');
    const { data: response } = await axios.get<SearchColumnValuesResponse>('/api/column/values', {params});
    return response;
  }

  async function initColumns() {
    const columnToValues = await getDistinctValuesForColumns(filterColumns);
    const columns = baseColumns;
    const filters = filterColumns.reduce((obj: Filters, column) => {
      obj[column] = {
        current: null,
        values: []
      }
      return obj;
    }, {} as Filters);

    Object.entries(columnToValues).forEach(([col, valueToCount]) => {
      if (col === 'Types') {
        const added = new Set();
        filters[col].values = Object.entries(valueToCount).reduce((arr: DefaultOptionType[], [value, count]) => {
          value.split(', ').forEach((key) => {
            if (!added.has(key)) {
              arr.push({ label: key, value: key});
              added.add(key)
            }
          })
          return arr;
        }, [])
        setFilters(filters);
        return;
      } 
      filters[col as FilterColumn].values = Object.entries(valueToCount).reduce((arr: DefaultOptionType[], [value, count]) => {
        arr.push({ label: value, value: value});
        return arr;
      }, [])
      setFilters(filters);
    })
    setColumns(Object.values(columns));
  }

  useEffect(()=>{
    initColumns();
  }, [])

  const handleTableChange: TableProps['onChange'] = (pagination, filters, sorter, { action, currentDataSource }) => {
    setTableParams({
      pagination: {
        ...pagination,
        ...(action === 'filter' ? { current: 1, total: currentDataSource.length} : {})
      },
      filters,
      ...sorter,
    });

    // `dataSource` is useless since `pageSize` changed
    if (pagination.pageSize !== tableParams.pagination?.pageSize) {
      setSearchString('');
      setData([]);
      resetExecutionTime();
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-24 space-y-8">
      <div className="w-full h-full">
        <div className="flex flex-row flex-wrap w-full space-x-4">
          <Form.Item label={<label>Include location bias{location ? '('+ Object.values(location).join(',') + ')': <Spin />}</label>} className="flex-4">
            <Switch
              disabled={!location}
              checked={includeLocationBias}
              onChange={(val) => {
                setIncludeLocationBias(val);
                setData([]);
                setTableParams((current) => {
                  const { pagination: currentPagination } = current
                  return {...current, pagination: { ...currentPagination, current: 1, total: 0}}
                })
              }}
            />
          </Form.Item>
          {filters && Object.entries(filters).map(([col, {current, values}]) => {
            const selectOptions: any = { allowClear: true }
            if (values && values.length > 10) {
              selectOptions['showSearch'] = true;
            }

            return (
              <Form.Item  key={col} label={col} className="flex-1">
                <Select
                  options={values?.toSorted((a,b) => a.value - b.value)}
                  value={current}
                  size="large"
                  {...selectOptions}
                  onSelect={(value) => setFilters((current) => {
                    const column = current[col as FilterColumn];
                    return {...current, [col]: {
                      ...column,
                      current: value,
                    }}
                  })}
                  onClear={() => setFilters((current) => {
                    const column = current[col as FilterColumn];
                    return {...current, [col]: {
                      ...column,
                      current: null,
                    }}
                  })}
                />
              </Form.Item>
            )
          })}
        </div>
        <Search placeholder="input search text" enterButton="Search" size="large" loading={loading} value={searchString} onChange={(e) => setSearchString(e.target.value)} onSearch={fetchData} className="mt-12"/>
        {executionTime !== null && <p className="text-xs text-slate-400">Top {tableParams.pagination.total} results fetched in {`${executionTime.toPrecision(5)}ms`}</p>}
        {locationError && <p className="text-xs text-red-400">Not using geospatial information for search: ${locationError}</p>}
      </div>
      {columns? <Table
        columns={columns}
        className="w-full"
        rowKey={(record) => record.id}
        dataSource={data}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
    /> : <Spin size="large"/>}
    </main>
  );
}
