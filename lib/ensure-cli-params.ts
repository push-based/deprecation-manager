import * as yargs from "yargs";

export function ensureCliParams<T extends object>(expectedParams: {key: keyof T, fallBack: T[keyof T]}[], assert = false): T {
  const wd = process.cwd();

  const passedParamsArray = (yargs.argv._ as unknown) as T;
  const passedParams = yargs.argv;
  const expectedParamsMap: T = expectedParams.reduce((obj, param) => ({...obj, [param.key]: param.fallBack}), {} as T)
  let parsedParams: T = {} as T;

  if(Array.isArray(passedParamsArray) && passedParamsArray.length) {
    console.log('isArray', passedParamsArray)
    parsedParams = passedParamsArray
      .map((value, idx) => value !== undefined ? value : expectedParams[idx].fallBack)
      .reduce((params, value, idx) => ({ ...params, [expectedParams[idx].key]: value }), {} as any)
  } else {
    console.log('isObj', passedParamsArray)
    parsedParams = Object.entries(passedParams)
      .map((v) => { console.log(v); return v})
      .filter(([key,_]) => expectedParams.some(i => i.key === key))
      .map(([key, value]) => ({[key]: value !== undefined ? value : expectedParamsMap[key]}))
      .reduce((params, slice) => ({...params, ...slice}), {} as any)
  }

  if(assert && expectedParams.length !== Object.keys(parsedParams).length) {
    throw new Error(`Params ${expectedParams} required. use --paramName my-project or ' ' my-project`)
  }

  return { ...expectedParamsMap, ...parsedParams};
}
