/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function () {

  function Receptacles(id, form, properties, constraints) {
    this.id = id;
    this.form = form;
    this.properties = properties;
    this.constraints = constraints;
    this.selectItemsCount = -1;
    this.type = '';
    this.allowShared = false;
    this.allowEmbedded = false;
    this.defaultEnableBrowseExisting = false;
    this.defaultEnableSearchExisting = false;
    this.baseRepoPath = '/site/components';
    this.baseBrowsePath = '/site/components';
    //this.countOptions = 0;
    const i18n = CrafterCMSNext.i18n;
    this.formatMessage = i18n.intl.formatMessage;
    this.messages = i18n.messages.receptaclesMessages;

    properties.forEach(prop => {
      if (prop.value) {
        this[prop.name] = prop.value;
      }
    });

    return this;
  }

  Receptacles.prototype = {
    itemsAreContentReferences: true,

    createElementAction: function (control, _self, addContainerEl) {
      // if(this.countOptions > 1) {
      //   control.addContainerEl = null;
      //   control.containerEl.removeChild(addContainerEl);
      // }
      // if (_self.type === "") {
      //   CStudioAuthoring.Operations.createNewContent(
      //     CStudioAuthoringContext.site,
      //     _self.processPathsForMacros(_self.repoPath),
      //     false, {
      //       success: function (formName, name, value) {
      //         control.insertItem(value, formName.item.internalName, null, null, _self.id);
      //         control._renderItems();
      //       },
      //       failure: function () {
      //       }
      //     }, true);
      // } else {
      //   CStudioAuthoring.Operations.openContentWebForm(
      //     _self.type,
      //     null,
      //     null,
      //     _self.processPathsForMacros(_self.repoPath),
      //     false,
      //     false,
      //     {
      //       success: function (contentTO, editorId, name, value) {
      //         control.insertItem(name, value, null, null, _self.id);
      //         control._renderItems();
      //         CStudioAuthoring.InContextEdit.unstackDialog(editorId);
      //       },
      //       failure: function () {
      //       }
      //     },
      //     [
      //       { name: "childForm", value: "true"}
      //     ]);
      // }
    },

    browseExistingElementAction: function (control, _self, addContainerEl) {
      // if(this.countOptions > 1) {
      //   control.addContainerEl = null;
      //   control.containerEl.removeChild(addContainerEl);
      // }
      // // if the browsePath property is set, use the property instead of the repoPath property
      // // otherwise continue to use the repoPath for both cases for backward compatibility
      // var browsePath = _self.repoPath;
      // if (_self.browsePath != undefined && _self.browsePath != '') {
      //   browsePath = _self.browsePath;
      // }
      // CStudioAuthoring.Operations.openBrowse("", _self.processPathsForMacros(browsePath), _self.selectItemsCount, "select", true, {
      //   success: function (searchId, selectedTOs) {
      //     for (var i = 0; i < selectedTOs.length; i++) {
      //       var item = selectedTOs[i];
      //       var value = (item.internalName && item.internalName != "") ? item.internalName : item.uri;
      //       control.insertItem(item.uri, value, null, null, _self.id);
      //       control._renderItems();
      //     }
      //   },
      //   failure: function () {
      //   }
      // });
    },

    searchExistingElementAction: function (control, _self, addContainerEl) {
      // if (this.countOptions > 1) {
      //   control.addContainerEl = null;
      //   control.containerEl.removeChild(addContainerEl);
      // }
      //
      // var searchContext = {
      //   searchId: null,
      //   itemsPerPage: 12,
      //   keywords: "",
      //   filters: {},
      //   sortBy: "internalName",
      //   sortOrder: "asc",
      //   numFilters: 1,
      //   filtersShowing: 10,
      //   currentPage: 1,
      //   searchInProgress: false,
      //   view: 'grid',
      //   lastSelectedFilterSelector: '',
      //   mode: "select"              // open search not in default but in select mode
      // };
      //
      // CStudioAuthoring.Operations.openSearch(searchContext, true, {
      //   success(searchId, selectedTOs) {
      //     selectedTOs.forEach (function(item) {
      //       var value = (item.internalName && item.internalName !== "") ? item.internalName : item.uri;
      //       control.insertItem(item.uri, value, null, null, _self.id);
      //       control._renderItems();
      //     });
      //   },
      //   failure: function () {
      //   }
      // }, searchContext.searchId);
    },

    add: function (control) {
      const self = this;
      if (this.contentTypes) {
        this.contentTypes.split(',').forEach(contentType => {
          self._createContentTypesControls(contentType, $(control.addContainerEl), self.messages, control);
        });
      }
    },

    edit: function (key, control) {
      const self = this;
      if (key.endsWith('.xml')) {
        self._editShared(key, control);
      } else {
        self._editEmbedded(key, control);
      }
    },

    updateItem: function (item, control) {
    },

    getLabel: function () {
      return this.formatMessage(this.messages.receptacles);
    },

    getInterface: function () {
      return 'item';
    },

    getName: function () {
      return 'receptacles';
    },

    getSupportedProperties: function () {
      return [
        {
          label: this.formatMessage(this.messages.allowShared),
          name: 'allowShared',
          type: 'boolean',
          defaultValue: 'true'
        },
        {
          label: this.formatMessage(this.messages.allowEmbedded),
          name: 'allowEmbedded',
          type: 'boolean',
          defaultValue: 'true'
        },
        {
          label: this.formatMessage(this.messages.enableBrowse),
          name: 'enableBrowse',
          type: 'boolean',
          defaultValue: 'false'
        },
        {
          label: this.formatMessage(this.messages.enableSearch),
          name: 'enableSearch',
          type: 'boolean',
          defaultValue: 'false'
        },
        {
          label: this.formatMessage(this.messages.baseRepositoryPath),
          name: 'baseRepositoryPath',
          type: 'string',
          defaultValue: '/site/components'
        },
        {
          label: this.formatMessage(this.messages.baseBrowsePath),
          name: 'baseBrowsePath',
          type: 'string',
          defaultValue: '/site/components'
        },
        { label: this.formatMessage(this.messages.contentTypes), name: 'contentTypes', type: 'contentTypes' },
        { label: this.formatMessage(this.messages.tags), name: 'tags', type: 'string' }
      ];
    },

    getSupportedConstraints: function () {
      return [];
    },

    _editShared(key, control) {
      CStudioAuthoring.Service.lookupContentItem(CStudioAuthoringContext.site, key, {
        success: function (contentTO) {
          CStudioAuthoring.Operations.editContent(
            contentTO.item.contentType,
            CStudioAuthoringContext.siteId,
            contentTO.item.uri,
            contentTO.item.nodeRef,
            contentTO.item.uri,
            false,
            {
              success: function (contentTO, editorId, name, value) {
                if (control) {
                  control.updateEditedItem(value);
                  CStudioAuthoring.InContextEdit.unstackDialog(editorId);
                }
              }
            });
        },
        failure: function () {
        }
      });
    },
    _editEmbedded(key, control) {
      CStudioForms.communication.sendAndAwait(key, (message) => {
        const contentType = CStudioForms.communication
          .parseDOM(message.payload)
          .querySelector('content-type')
          .innerHTML;
        CStudioAuthoring.Operations.performSimpleIceEdit(
          { contentType: contentType, uri: key },
          null,
          true,
          {
            success: function (contentTO, editorId, name, value) {
              if (control) {
                control.updateEditedItem(value);
              }
            }
          },
          [],
          true
        );
      });
    },

    _createContentTypesControls(contentType, $addContainerEl, messages, control) {
      const self = this;

      function createOption(message, type) {
        let $option = $(`
            <div class="cstudio-form-control-node-selector-add-container-item">
              ${message} ${contentType}
            </div>
          `);
        $option.on('click', function () {
          control.addContainerEl = null;
          $addContainerEl.remove();
          self._openContentTypeForm(contentType, type, control);
        });
        return $option;
      }

      if (self.allowEmbedded) {
        $addContainerEl.append(createOption(self.formatMessage(messages.createNewEmbedded), 'embedded'));
      }
      if (self.allowShared) {
        $addContainerEl.append(createOption(self.formatMessage(messages.createNewShared), 'shared'));
      }
    },

    _openContentTypeForm(contentType, type, control) {
      const self = this;
      const path = `${self.baseRepoPath}/${contentType.replace(/\//g, '_').substr(1)}`;
      CStudioAuthoring.Operations.openContentWebForm(
        contentType,
        null,
        null,
        type === 'shared' ? path : '',
        false,
        false,
        {
          success: function (contentTO, editorId, name, value) {
            control.newInsertItem(name, value, type);
            control._renderItems();
            CStudioAuthoring.InContextEdit.unstackDialog(editorId);
          },
          failure: function () {
          }
        },
        [
          { name: 'childForm', value: 'true' }
        ],
        null,
        type === 'embedded' ? true : null
      );
    },

  };

  CStudioAuthoring.Module.moduleLoaded('cstudio-forms-controls-receptacles', Receptacles);
})();
