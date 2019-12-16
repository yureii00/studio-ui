/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { BehaviorSubject, Subject } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { filter, share, map } from 'rxjs/operators';
import { ModelHelper } from './ModelHelper';
import {
  CONTENT_TYPES_RESPONSE,
  createLookupTable, DELETE_ITEM_OPERATION,
  GUEST_MODELS_RECEIVED, INSERT_COMPONENT_OPERATION, INSERT_ITEM_OPERATION, MOVE_ITEM_OPERATION,
  pluckProps,
  reversePluckProps,
  SORT_ITEM_OPERATION, UPDATE_FIELD_VALUE_OPERATION
} from '../util';
import Cookies from 'js-cookie';
import { fromTopic, post } from '../communicator';
import uuid from 'uuid/v4';

const apiUrl = 'http://authoring.sample.com:3030';

export class ContentController {

  static operations$ = new Subject();
  static operations = ContentController.operations$.asObservable();

  /* private */
  static models$ = new BehaviorSubject({ /*'modelId': { ...modelData }*/ });
  /* private */
  static modelsObs$ = ContentController.models$.asObservable().pipe(
    filter((objects) => Object.keys(objects).length > 0),
    share()
  );

  /* private */
  static contentTypes$ = new BehaviorSubject({ /*...*/ });
  /* private */
  static contentTypesObs$ = ContentController.contentTypes$.asObservable().pipe(
    filter((objects) => Object.keys(objects).length > 0),
    share()
  );

  modelRequestsInFlight = {};

  constructor() {
    fromTopic(CONTENT_TYPES_RESPONSE).subscribe((data) => {
      this.contentTypesResponseReceived(data.payload);
    });
  }

  getModel(modelId)/*: Promise<Model> */ {
    return this.getModel$(modelId).toPromise();
  }

  getModel$(modelId)/*: Observable<Model> */ {
    return this.models$(modelId).pipe(
      filter(models => modelId in models),
      map(models => models[modelId])
    );
  }

  getContentType(contentTypeId) {
    return this.getContentType$(contentTypeId).toPromise();
  }

  getContentType$(contentTypeId) {
    (!this.hasCachedContentType(contentTypeId)) && this.fetchContentType(contentTypeId);
    return ContentController.contentTypesObs$.pipe(
      filter(contentTypes => contentTypeId in contentTypes),
      map(contentTypes => contentTypes[contentTypeId])
    );
  }

  models$(modelId)/*: Observable<Model> */ {
    (modelId && !this.hasCachedModel(modelId)) && this.fetchModel(modelId);
    return ContentController.modelsObs$;
  }

  contentTypes$()/*: Observable<Model> */ {
    return ContentController.contentTypesObs$;
  }

  operations$() {
    return ContentController.operationsObs$;
  }

  hasCachedModel(modelId) {
    return (this.getCachedModel(modelId) != null);
  }

  getCachedModel(modelId) {
    return this.getCachedModels()[modelId];
  }

  getCachedModels() {
    return ContentController.models$.value;
  }

  hasCachedContentType(contentTypeId) {
    return (this.getCachedContentType(contentTypeId) != null);
  }

  getCachedContentType(contentTypeId) {
    return this.getCachedContentTypes()[contentTypeId];
  }

  getCachedContentTypes() {
    return ContentController.contentTypes$.value;
  }

  updateField(modelId, fieldId, value) {

    const models = this.getCachedModels();
    const model = { ...models[modelId] };

    ModelHelper.value(model, fieldId, value);

    ContentController.models$.next({
      ...models,
      [modelId]: model
    });

    ContentController.operations$.next({
      type: 'update-field',
      args: arguments
    });

    post(UPDATE_FIELD_VALUE_OPERATION, { modelId, fieldId });

  }

  insertItem(
    modelId/*: string*/,
    fieldId/*: string*/,
    index/*: number*/,
    item
  ) {

    const models = this.getCachedModels();
    const model = models[modelId];
    const collection = ModelHelper.value(model, fieldId);
    const result = collection.slice(0);

    // Insert in desired position
    result.splice(index, 0, item);

    ContentController.models$.next({
      ...models,
      [modelId]: {
        ...model,
        [fieldId]: result
      }
    });

    ContentController.operations$.next({
      type: 'insert',
      args: arguments
    });

    post(INSERT_ITEM_OPERATION, { modelId, fieldId, index, item });

  }

  insertComponent(modelId, fieldId, targetIndex, contentType, shared = false) {
    if (typeof contentType === 'string') {
      contentType = this.getCachedContentType(contentType);
    }

    const models = this.getCachedModels();
    const model = models[modelId];
    const collection = ModelHelper.value(model, fieldId);
    const result = collection.slice(0);

    // Create Item
    // const now = new Date().toISOString();
    const instance = {
      craftercms: {
        id: uuid(),
        path: null,
        label: `New ${contentType.name}`,
        contentType: contentType.id,
        // dateCreated: now,
        // dateModified: now,
        locale: 'en'
      }
    };

    function processFields(instance, fields) {
      Object.entries(fields).forEach(([id, field]) => {
        switch (field.type) {
          case 'repeat':
          case 'node-selector': {
            instance[id] = [];
            if (field.type === 'repeat') {
              instance[id].push({});
              processFields(instance[id][0], field.fields);
            }
            break;
          }
          default:
            instance[id] = field.defaultValue;
        }
      });
    }

    processFields(instance, contentType.fields);

    // Insert in desired position
    result.splice(targetIndex, 0, instance);

    ContentController.models$.next({
      ...models,
      [instance.craftercms.id]: instance,
      [modelId]: {
        ...model,
        [fieldId]: result
      }
    });

    ContentController.operations$.next({
      type: INSERT_COMPONENT_OPERATION,
      args: { modelId, fieldId, targetIndex, contentType, shared, instance }
    });

    post(INSERT_COMPONENT_OPERATION, { modelId, fieldId, targetIndex, contentType, shared, instance });


  }

  insertGroup(modelId, fieldId, data) {
  }

  sortItem(
    modelId/*: string*/,
    fieldId/*: string*/,
    currentIndex/*: number*/,
    targetIndex/*: number*/
  ) {

    const models = this.getCachedModels();
    const model = models[modelId];
    const collection = ModelHelper.value(model, fieldId);
    const result = collection
      .slice(0, currentIndex)
      .concat(collection.slice(currentIndex + 1));

    // Insert in desired position
    result.splice(targetIndex, 0, collection[currentIndex]);

    ContentController.models$.next({
      ...models,
      [modelId]: {
        ...model,
        [fieldId]: result
      }
    });

    ContentController.operations$.next({
      type: 'sort',
      args: arguments
    });

    post(SORT_ITEM_OPERATION, { modelId, fieldId, currentIndex, targetIndex });

  }

  moveItem(
    originalModelId/*: string*/,
    originalFieldId/*: string*/,
    originalIndex/*: number*/,
    targetModelId/*: string*/,
    targetFieldId/*: string*/,
    targetIndex/*: number*/
  ) {

    const models = this.getCachedModels();

    const currentModel = models[originalModelId];
    const currentCollection = ModelHelper.value(currentModel, originalFieldId);
    const result = currentCollection
      .slice(0, originalIndex)
      .concat(currentCollection.slice(originalIndex + 1));

    const targetModel = models[targetModelId];
    const targetCollection = ModelHelper.value(targetModel, targetFieldId);
    const targetResult = targetCollection.slice(0);

    // Insert in desired position
    targetResult.splice(targetIndex, 0, currentCollection[originalIndex]);

    ContentController.models$.next(
      (originalModelId === targetModelId)
        ? {
          ...models,
          [originalModelId]: {
            ...currentModel,
            [originalFieldId]: result,
            [targetFieldId]: targetResult
          }
        } : {
          ...models,
          [originalModelId]: {
            ...currentModel,
            [originalFieldId]: result
          },
          [targetModelId]: {
            ...targetModel,
            [targetFieldId]: targetResult
          }
        }
    );

    ContentController.operations$.next({
      type: 'move',
      args: arguments
    });

    post(MOVE_ITEM_OPERATION, {
      originalModelId,
      originalFieldId,
      originalIndex,
      targetModelId,
      targetFieldId,
      targetIndex
    });

  }

  deleteItem(
    modelId/*: string*/,
    fieldId/*: string*/,
    index/*: number*/,
  ) {

    const models = this.getCachedModels();
    const model = models[modelId];
    const collection = ModelHelper.value(model, fieldId);
    const result = collection
      .slice(0, index)
      .concat(collection.slice(index + 1));

    ContentController.models$.next({
      ...models,
      [modelId]: {
        ...model,
        [fieldId]: result
      }
    });

    ContentController.operations$.next({
      type: DELETE_ITEM_OPERATION,
      args: arguments,
      state: { item: collection[index] }
    });

    post(DELETE_ITEM_OPERATION, { modelId, fieldId, index });

  }

  /* private */
  createModelRequest(modelId) {
    return ajax.get(`${apiUrl}/content/${modelId}`);
  }

  /* private */
  fetchModel(modelId) {
    if (!(modelId in this.modelRequestsInFlight)) {
      this.modelRequestsInFlight[modelId] = fetchById(modelId).subscribe(
        (response) => {
          delete this.modelRequestsInFlight[modelId];
          this.modelsResponseReceived(response);
        },
        (e) => console.log('Model fetch has failed...', e)
      );
    }
  }

  /* private */
  fetchContentType(contentTypeId) {
    return false;
  }

  /* private */
  modelsResponseReceived(responseModels) {

    if (Array.isArray(responseModels)) {
      responseModels = createLookupTable(responseModels, 'craftercms.id');
    }

    const currentModels = ContentController.models$.value;

    post(GUEST_MODELS_RECEIVED, responseModels);

    ContentController.models$.next(
      Object.assign(
        {},
        currentModels,
        responseModels
      )
    );

  }

  /* private */
  contentTypesResponseReceived(responseContentTypes) {

    if (Array.isArray(responseContentTypes)) {
      responseContentTypes = createLookupTable(responseContentTypes);
    }

    const currentContentTypes = ContentController.contentTypes$.value;

    ContentController.contentTypes$.next(
      Object.assign(
        {},
        currentContentTypes,
        responseContentTypes
      )
    );

  }

  /* private */
  responseReceived(response) {
    const

      currentContentTypes = ContentController.contentTypes$.value,
      currentModels = ContentController.models$.value,

      responseContentTypes = response.contentTypes,
      responseModels = response.data;

    // cancel any inflight requests for loaded types.

    ContentController.contentTypes$.next(
      Object.assign({},
        currentContentTypes,
        responseContentTypes)
    );

    ContentController.models$.next(
      Object.assign({},
        currentModels,
        responseModels)
    );

    // Update test.
    // setTimeout(() => {
    //   const
    //     contentTypes = ContentController.contentTypes$.value,
    //     models = ContentController.models$.value;
    //
    //   models['4qT1W3HXewc'].title = 'NEW TITLE!';
    //   models['3biG6L6Kx06Q'].items[0].title = 'NEW TITLE!';
    //   models['feature_1'].title = 'NEW TITLE!';
    //
    //   contentTypes['3biG6LKx06Q_ctid'].name = 'NEW COMPONENT NAME';
    //
    //   ContentController.contentTypes$.next(contentTypes);
    //   ContentController.models$.next(models);
    // }, 2000);

  }

}

function fetchById(id, site = Cookies.get('crafterSite')) {
  const isArticleRequest = [
    'f360780a-372f-d005-d736-bcc9d657e50c',
    'b7a724f1-3422-055d-a244-5fc79a1ca007',
    '52e8e75d-94f8-ae0b-3317-8d592b3d7dce',
    '07fc5ac7-05ea-b038-6455-26f895ba8822',
    '6121741f-8b6f-75ce-151b-75e57f04da13',
    '8bdd0180-b7c8-1eff-1f20-76ddca377e3c',
    'd5824453-b743-4575-bb7a-5c49c0fbedbb',
    'b30875f3-87ce-7b55-fd19-3d5c00508a08',
    'f1f9c488-67e1-7ec0-d3ca-560b194e64d1'
  ].includes(id);
  return ajax.post(
    `/api/1/site/graphql?crafterSite=${site}`,
    {
      variables: { id },
      query: (isArticleRequest ? `
        query Articles($id: String) {
          contentItems: page_article {
            total
            items {
              id: objectId(filter: {equals: $id})
              path: localId
              contentType: content__type
              dateCreated: createdDate_dt
              dateModified: lastModifiedDate_dt
              label: internal__name
              title_t
              author_s
              categories_o {
                item {
                  key
                  value_smv
                }
              }
              featured_b
              summary_t
              subject_t
              segments_o {
                item {
                  key
                  value_smv
                }
              }
              sections_o {
                item {
                  section_html
                }
              }
              orderDefault_f
              left__rail_o {
                ...ContentIncludeWrapperFragment
              }
              header_o {
                ...ContentIncludeWrapperFragment
              }
              image_s
            }
          }
        }` : `
        query Page {
          contentItems {
            total
            items {
              id: objectId
              path: localId
              contentType: content__type
              dateCreated: createdDate_dt
              dateModified: lastModifiedDate_dt
              label: internal__name
              ...on component_articles__widget {
                title_t
                max_articles_i

              }
              ...on component_contact__widget {
                title_t
                text_html
                email_s
                phone_s
                address_html
              }
              ...on component_feature {
                icon_s
                title_t
                body_html
              }
              ...on component_header {
                logo_s
                logo_text_t
                business_name_s
                social_media_links_o {
                  item {
                    social_media_s
                    url_s
                  }
                }
              }
              ...on component_left__rail {
                widgets_o {
                  item {
                    key
                    component {
                      id: objectId
                    }
                  }
                }
              }
              ...on page_home {
                title_t
                header_o {
                  ...ContentIncludeWrapperFragment
                }
                left__rail_o {
                  ...ContentIncludeWrapperFragment
                }
                hero_title_html
                hero_text_html
                hero_image_s
                features_title_t
                features_o {
                  ...ContentIncludeWrapperFragment
                }
              }
              ...on taxonomy {
                items {
                  item {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      `) + (`
        fragment ContentIncludeWrapperFragment on ContentIncludeWrapper {
          item {
            key
            component {
              id: objectId
              ...on component_feature {
                icon_s
                title_t
                body_html
                contentType: content__type
                dateCreated: createdDate_dt
                dateModified: lastModifiedDate_dt
                label: internal__name
              }
            }
          }
        }
      `)
    },
    { 'Content-Type': 'application/json' }
  ).pipe(
    map(({ response }) => response.data.contentItems.items.reduce(
      (lookupTable, model) => {

        const systemPropList = ['id', 'path', 'contentType', 'dateCreated', 'dateModified', 'label'];

        if ([
          '/page/search-results',
          '/component/level-descriptor'
        ].includes(model.contentType)) {
          return lookupTable;
        }

        const system = pluckProps(model, ...systemPropList);
        const data = reversePluckProps(model, ...systemPropList);

        Object.entries(data).forEach(([key, value]) => {
          if (key.endsWith('_o')) {
            data[key] = [];
            value.item.forEach((item) => {
              data[key].push(
                // 1. Components
                item.component?.id ||
                // 2. Repeat Groups
                item
              );
              if (item.component?.id && item.component.id === item.key) {
                // Embedded component found.
                lookupTable[item.component.id] = {
                  craftercms: pluckProps(item.component, ...systemPropList),
                  ...reversePluckProps(item.component, ...systemPropList)
                };
              }
            });
            data[key] = value.item.map((item) => item.component?.id || item);
          } else if (model.contentType === '/taxonomy' && key === 'items') {
            data[key] = value.item;
          }
        });

        lookupTable[model.id] = {
          craftercms: system,
          ...data
        };

        return lookupTable;

      },
      {}
    ))
  );
}

export const contentController = new ContentController();

export default contentController;
