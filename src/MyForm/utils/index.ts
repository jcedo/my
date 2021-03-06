import {FormConfig} from '../interface';

const o:string = ".";
const a:string = "_";
const ALL:string = "*";
// 只提取基本数据类型
const ONLYBASE:boolean = false;

function isBase(data: any):boolean{
  return typeof data !== "object";
}

function isArr(data: any):boolean{
  return Object.prototype.toString.call(data) === "[object Array]";
}

function isObj(data:any):boolean{
  return Object.prototype.toString.call(data) === '[object Object]';
}
function isNumber(str:string):boolean{
  return /^[0-9]+$/.test(str);
}

/**
 * 对于还需取下一级的继续向下取 
 */
function handleGetData(obj:any, currentKey:string, nextPath:string, history:string){
  let r = {};
  if(isObj(obj)){
    let keyArr = currentKey === ALL ? Object.keys(obj) : [currentKey];
    keyArr.forEach(key => {
      r = Object.assign(r, getData(obj[key], nextPath, `${history}.${key}`));
    })
  }else if(isArr(obj)){
    if(currentKey === ALL){
      obj.forEach((_:any, index:number) => {
        r = Object.assign(r, getData(obj[index], nextPath, `${history}_${index}`));
      })
    }else if(isNumber(currentKey)){
      r = Object.assign(r, getData(obj[Number(currentKey)], nextPath, `${history}_${currentKey}`));
    }
  }
  return r;
}

/**
 * 责任链式判断 拆分if-else
 */
const rules = [
  {
    match: (oi:number, ai:number) =>  (oi === ai),
    action:function(oi:number, ai:number, path:string, obj:any, history:string){
      // 只提取基本数据类型
      // if(isBase(obj) === ONLYBASE) return {};
      let r:{[key:string]:any} = {};
      if(path === ALL){
        if(isObj(obj)){
          Object.keys(obj).forEach((key) => {
            if(isBase(obj[key]) === ONLYBASE){
              r[`${history}.${key}`] = obj[key];
            }
          })
        }else if(isArr(obj)){
          obj.forEach((v:any,index:number) => {
            if(isBase(v) === ONLYBASE){
              r[`${history}_${index}`] = v;
            }
          })
        }
      }else{
        if(isObj(obj)){
          r[`${history}.${path}`] = obj[path];
        }else if(isArr(obj) && isNumber(path)){
          r[`${history}_${path}`] = obj[Number(path)];
        }
      }
      return r;
    }
  },{
    match: (oi:number, ai:number) =>  ( oi === -1 && ai !== -1),
    action:function(oi:number, ai:number, path:string, obj:any, history:string){
      const currentKey = path.substring(0, ai);
      const nextPath = path.substring(ai+1, path.length);
      let r = {};
      r = handleGetData(obj, currentKey, nextPath, history);
      return r;
    }
  },{
    match: (oi:number, ai:number) => ( oi !== -1 && ai === -1),
    action:function(oi:number, ai:number, path:string, obj:any, history:string){
      const currentKey = path.substring(0, oi);
      const nextPath = path.substring(oi+1, path.length);
      let r = {};
      r = handleGetData(obj, currentKey, nextPath, history);
      return r;
    }
  },{
    match: (oi:number, ai:number) => ( oi !== -1 && ai !== -1 && oi < ai),
    action:function(oi:number, ai:number, path:string, obj:any, history:string){
      const currentKey = path.substring(0, ai);
      const nextPath = path.substring(ai+1, path.length);
      let r = handleGetData(obj, currentKey, nextPath, history);
      return r;
    }
  },{
    match: (oi:number, ai:number) => ( oi !== -1 && ai !== -1 && oi > ai),
    action:function(oi:number, ai:number, path:string, obj:any, history:string){
      const currentKey = path.substring(0, ai);
      const nextPath = path.substring(ai+1, path.length);
      let r = handleGetData(obj, currentKey, nextPath, history);
      return r;
    }
  }
]

/**
 * 入口方法
 */
function getData(obj:any, path:string, history:string):object{
  if(!path){ console.warn('path is undefined'); return {}; }
  if(path === ""){ console.warn('path is empty'); return {}; }
  if(isBase(obj)){ return {}; }
  let r = {};
  const oi = path.indexOf(o);
  const ai = path.indexOf(a);
  for(let i = 0; i < rules.length ; i ++){
    if(rules[i].match(oi, ai)){
      r = Object.assign(r, rules[i].action(oi, ai, path, obj, history))
    }
  }
  return r;
}

/**
 * 遍历路径数组
 */
export function loopPath(obj:any, pathArr:Array<string>):object{
  let r = {};
  pathArr.forEach((path:string) => {
    // TODO 目前现在这个位置进行修改，之后再考虑那个点需不需要改
    path = path.substring(1,path.length);
    r = {
      ...r,
      ...getData(obj,path,"")
    }
  });
  return r;
}



/**
 * 获取render所需的data结构
 * config类型之后完善
 */
export function getRenderData(config:Array<FormConfig>, data:any): Array<FormConfig> {
  if(!data){
    return config;
  }
  let rConfig:Array<FormConfig> = config.map(v => v);
  let cData:{[key:string]:any} = loopPath(data, config.map(v => v.path));
  for(let i = 0 ; i < rConfig.length ; i++){
    rConfig[i].value = cData[rConfig[i].path];
  }
  return rConfig;
}

/* ============================== 本地格式转为接口格式 ==================================== */
/**
 * 默认parentKey为数字是即生成数组
 * @param {string} parentKey 
 * @param {object|Array} data 
 */
function newObj(parentKey:string, currentKey:string, data:any){
  if(!currentKey) return {};
  let r:{[key:string]:any} = {};
  if(parentKey === ""){
    if(isNumber(currentKey)){
      r = [];
      r[Number(currentKey)] = data;
    }else{
      r[currentKey] = data;
    }
  }else{
    if(isNumber(currentKey)){
      let g:{[key:string]:any} = {};
      g[parentKey] = [];
      g[parentKey][Number(currentKey)] = data;
      r = _assign(r, toFormat(g));
    }else{
      let g:{[key:string]:any} = {};
      g[parentKey] = {};
      g[parentKey][currentKey] = data;
      r = _assign(r, toFormat(g));
    }
  }
  return r;
}

/**
 * 因为转换出来的对象名称相同，直接使用Object.assign会导致覆盖
 * 所有需要此方法做合并处理（正常情况下是不会去重的，除非在转换的时候已经出现了重复）
 * 合并两个对象
 */
function _assign(mainData: any, newData: any ): any{
  
  if(isObj(mainData) && isObj(newData)){
    const mainKey = Object.keys(mainData);
    const newKey = Object.keys(newData);
    for(let i = 0 ; i < newKey.length ; i++){
      let flag = false;
      for(let j = 0; j < mainKey.length ; j++){
        const mk = mainKey[j];
        const nk = newKey[i];
        if(mk === nk){
          flag = true;
          // 判别下一层是不是数组，数组需要特殊处理 - 这个方法应该不会常用
          if(isArr(mainData[mk]) && isArr(newData[nk])){
            mainData[mk] = mainData[mk].filter((v:any) => !!v).concat(newData[nk].filter((v:any) => !!v));
          }else{
            // default object
            mainData[mk] = {
              ...mainData[mk],
              ...newData[nk]
            }
          }
        }
      }
      if(!flag){
        mainData = {
          ...mainData,
          [newKey[i]]: newData[newKey[i]]
        }
      }
    }
  }else{
    console.error("其中一个参数不是对象");
  }
  return mainData;
}

/**
 * Convert custom data to server format data
 *  
 */
export function toFormat(data:{[key:string]:any}):object{
  let r = {};
  Object.keys(data).forEach(key => {
    let oi = key.lastIndexOf(o);
    let ai = key.lastIndexOf(a);
    if(oi === ai){
      console.warn('isolated data');
      r = _assign(r, newObj("", key, data[key]));
    }else if(oi === -1){
      const currentKey = key.substring(ai+1, key.length);
      const parentKey = key.substring(0, ai);
      r = _assign(r, newObj(parentKey, currentKey,data[key]));
    }else if(ai === -1){
      const currentKey = key.substring(oi+1, key.length);
      const parentKey = key.substring(0, oi);
      r = _assign(r, newObj(parentKey, currentKey, data[key]));
    }else if(oi < ai){
      // 变成数组
      const currentKey = key.substring(ai+1, key.length);
      const parentKey = key.substring(0, ai);
      r = _assign(r, newObj(parentKey, currentKey, data[key]));
    }else if(oi > ai){
      const currentKey = key.substring(oi+1, key.length);
      const parentKey = key.substring(0, oi);
      r = _assign(r, newObj(parentKey, currentKey, data[key]));
    }
  })
  return r;
}

