

import defaultAdapter from './defaultAdapter'

/*

  API :

  init(notionDBPageId, entities)

  example :

  const entities = {
    'Response': {
      primaryKey: 'id',
      relations: {
        card: 'Card',
      },
    },
    'Card': {
      primaryKey: 'id',
      relations: {
        responses: 'Response',
      },
    },
  }

  then call :

  const response = await findOne('Response', { card: 'id1' }, {
    populate: ['card', 'card.responses']
  })

  - Description
    - Not typing dependant

  - Caveats
    - no M:M, 1:1
    - no caching
    - no typechecking
    - PrimaryKey needs to be set before insert

  - DONE
    - handle entities relations
    - handle nested populate
    - handle findOne not Found
    - findOne
    - find
    - nativeInsert

  - TODOS
    - simplified API
      - like default primaryKey for entities (use a config adapter)
      - default relationType
    - Auto generate populate, avoiding circular dependencies
    - Filtering
    - Ordering
    - Pagination
    - auto-validate TypeScript classes using Joi.
    - nativeUpdate
    - nativeDelete
    - JOI or else to entities
    - Database save

*/


// TODO : See where to save notionDbs ids for production use
// const notionDBs = {
//   'Deck': '36e3a8b870e3426ab7e94d1af0beafbe',
//   'Card': '9dd0323e29544d89aa6a74428a7bd21e',
// }

let entities

let adapter = defaultAdapter

export const init = (options: { adapter?: any, entities: any }) => {
  if (options.adapter !== undefined) {
    adapter = options.adapter
  }

  entities = options.entities
}

// TODO : on exit cb

const populateElement = async <T>(entityName: string, childKey: string, element: T, populate: string[]): Promise<T | null> => {
  const childRelation = entities[entityName].relations[childKey]

  const childPopulate = populate.filter((childKey2: string) => childKey2.split('.').length > 1 && childKey2.split('.')[0] === childKey)
    .map((childKey2: string) => childKey2.split('.').slice(1).join('.'))
  
  // console.log({ entityName, childKey, childRelation, childPopulate })

  if (childRelation.type === '1:M') {
    // @ts-ignore
    element[childKey] = await find(childRelation.entity, {
      [childRelation.to]: element[entities[entityName].primaryKey]
    }, { populate: childPopulate })
  }
  else if (childRelation.type === 'M:1') {

    const childElement = await findOne(childRelation.entity, {
      [entities[childRelation.entity].primaryKey]: element[childKey]
    }, { populate: childPopulate })

    if (childElement !== undefined) {
      // @ts-ignore
      element[childKey] = childElement
    }
  }

  return element
}

export const find = async <T>(entityName: string, where: any, options?: any | string[], orderBy?: any, limit?: number, offset?: number): Promise<T[]> => {
  // console.log('NotionDB find', { entityName, where, options, orderBy, limit, offset })

  let elements = await adapter.find(entityName, where, orderBy, limit, offset)

  if (elements === undefined) return

  if (options?.populate !== undefined) {

    const populate = options.populate.filter((childKey: string) => childKey.split('.').length === 1)

    for (const childKey of populate as string[]) {
      // @ts-ignore
      elements = await Promise.all(elements.map(async (element: T) => await populateElement(entityName, childKey, element, options.populate)))
    }
  }

  // @ts-ignore
  return elements
}

// How to do class like inheritance in functionnal -> no need
// Implement notion-adapter & default-adapter

export const findOne = async <T>(entityName: string, where: any, options?: any | string[]): Promise<T | null> => {
  // console.log('NotionDB findOne', { entityName, where, options: inspect(options) })
  
  // TODO : handle error in object structure
  
  let element: T = await adapter.findOne(entityName, where)

  if (element === undefined) return
  
  if (options?.populate !== undefined) {

    const populate = options.populate.filter((childKey: string) => childKey.split('.').length === 1)

    for (const childKey of populate as string[]) {
      element = await populateElement(entityName, childKey, element, options.populate)
    }
  }
  
  // console.log({ entityName, findOne: element })
  
  return element
}

// TODO : insert in already existing Deck
// TODO : PrimaryKey needs to be set before insert
// INFO : can't handle array of array in relations
// TODO : might ! does not await nested entity upload since id is set before
export const nativeInsert = async (entityName: string, data: any): Promise<any> => {
  // console.log('NotionDB nativeInsert', { entityName, data: inspect(data) })
  
  let data2 = data
  
  // insert nested entities, get their id, update data2, insert data2

  for (const [key, value] of Object.entries(data2)) {
    if (Object.keys(entities[entityName].relations).includes(key) &&
      ((entities[entityName].relations[key].type === 'M:1' && typeof value === 'object') ||
      // @ts-ignore
      (entities[entityName].relations[key].type === '1:M' && !value.some((element: any) => typeof element !== 'object')))) {
      
      const relation = entities[entityName].relations[key]

      // console.log({ key, value, relation })

      if (relation.type === '1:M') {
        // @ts-ignore
        for (const element of value) {
          const response = await nativeInsert(relation.entity, {
            ...element,
            [relation.to]: data[entities[entityName].primaryKey],
          })
          // TODO : might need response.id if no primaryKey is set
        }
        // @ts-ignore
        data2[key] = value.map((element: any) => element[entities[relation.entity].primaryKey])
      }
      else if (relation.type === 'M:1') {
        const response = await nativeInsert(relation.entity, {
          // @ts-ignore
          ...value,
          [relation.to]: data[entities[entityName].primaryKey],
        })
        // TODO : might be response.id
        // @ts-ignore
        data2[key] = element[entities[relation.entity].primaryKey]
      }
      else {
        console.log('Error : Unrecognize relation type :', { entityName, key, relation: entities[entityName].relations[key], data })
      }
    }
  }

  // INFO : here await since might be a db creation
  const response = await adapter.nativeInsert(entityName, data2)
  
  // console.log({ response })

  return response

  // new Promise((res, rej) => res({
  //   // data,
  //   affectedRows: 1,
  //   insertId: entityName === 'Deck' ? data.blockId : data.id
  // }))
}