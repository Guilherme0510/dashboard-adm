/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.geojson' {
    const value: any;
    export default value;
  }
  

  declare module 'xlsx-js-style' {
    import * as XLSX from 'xlsx';
    export = XLSX;
  }