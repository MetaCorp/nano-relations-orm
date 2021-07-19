
const find = async <T>(entityName: string, where: any, orderBy?: any, limit?: number, offset?: number): Promise<T[] | null> => {
  return null
}

const findOne = async <T>(entityName: string, where: any, options?: any | string[]): Promise<T | null> => {
  return null
}

const nativeInsert = async (entityName: string, data: any): Promise<any> => {
  return null
}

export default {
  find,
  findOne,
  nativeInsert
}
