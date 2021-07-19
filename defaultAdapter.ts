
// @ts-ignore
import { AnyEntity, EntityData, FilterQuery, QueryOrder, QueryResult } from '@mikro-orm/core'


const find = async <T extends AnyEntity>(entityName: string, where: FilterQuery<T>, orderBy?: Record<string, QueryOrder>, limit?: number, offset?: number): Promise<T[]> => {
  return
}

const findOne = async <T extends AnyEntity>(entityName: string, where: FilterQuery<T> | string, options?: any | string[]): Promise<T | null> => {
  return
}

const nativeInsert = async <T extends AnyEntity>(entityName: string, data: EntityData<T>): Promise<QueryResult> => {
  return
}

export default {
  find,
  findOne,
  nativeInsert
}
