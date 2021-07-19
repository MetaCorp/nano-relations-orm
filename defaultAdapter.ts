
const find = async <T>(entityName: string, where: any, orderBy?: any, limit?: number, offset?: number): Promise<T[]> => {
  return
}

const findOne = async <T>(entityName: string, where: any, options?: any | string[]): Promise<T | null> => {
  return
}

const nativeInsert = async (entityName: string, data: any): Promise<any> => {
  return
}

export default {
  find,
  findOne,
  nativeInsert
}
