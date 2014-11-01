/**
 * Copyright (C) 2005-2013 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * A specialization of [AlfMenuGroup]{@link module:alfresco/menus/AlfMenuGroup} to define widget configuration for
 * selecting the number of results to per page in a document list.
 * 
 * @module alfresco/documentlibrary/AlfResultsPerPageGroup
 * @extends module:alfresco/menus/AlfMenuGroup
 * @mixes module:alfresco/documentlibrary/_AlfDocumentListTopicMixin
 * @author Dave Draper
 */
define(["dojo/_base/declare",
        "alfresco/menus/AlfMenuGroup",
        "alfresco/documentlibrary/_AlfDocumentListTopicMixin",
        "alfresco/services/_PreferenceServiceTopicMixin",
        "dojo/_base/lang",
        "alfresco/menus/AlfCheckableMenuItem"], 
        function(declare, AlfMenuGroup, _AlfDocumentListTopicMixin, _PreferenceServiceTopicMixin, lang, AlfCheckableMenuItem) {

   return declare([AlfMenuGroup, _AlfDocumentListTopicMixin, _PreferenceServiceTopicMixin], {
      
      /**
       * An array of the i18n files to use with this widget.
       * 
       * @instance
       * @type {{i18nFile: string}[]}
       * @default [{i18nFile: "./i18n/AlfResultsPerPageGroup.properties"}]
       */
      i18nRequirements: [{i18nFile: "./i18n/AlfResultsPerPageGroup.properties"}],
      
      /**
       * @instance {number}
       * @default 25
       */
      documentsPerPage: 25,
      
      /**
       * The name of the group to assign to each of the [AlfCheckableMenuItems]{@link module:alfresco/menus/AlfCheckableMenuItem} 
       * that are created. If this widget is used more than once on any given page it is important to assign each instance
       * a different group as all the menu items in both widgets will share the same group and only one will ever be selected
       * across both groups.
       * 
       * @instance
       * @type {string}
       * @default "DOCUMENTS_PER_PAGE_GROUP"
       */
      groupName: "DOCUMENTS_PER_PAGE_GROUP",
      
      /**
       * @instance
       */
      postMixInProperties: function alfresco_documentlibrary_AlfResultsPerPageGroup__postMixInProperties() {
         this.inherited(arguments);
         this.alfSubscribe(this.docsPerpageSelectionTopic, lang.hitch(this, "onDocumentsPerPageChange"));
         this.alfPublish(this.getPreferenceTopic, {
            preference: "org.alfresco.share.documentList.documentsPerPage",
            callback: this.setDocumentsPerPage,
            callbackScope: this
         });
      },
      
      /**
       * Sets the number of documents per page
       * 
       * @instance
       * @param {number} value The number of documents per page.
       */
      setDocumentsPerPage: function alfresco_documentlibrary_AlfResultsPerPageGroup__setDocumentsPerPage(value) {
         if (value == null)
         {
            value = 25;
         }
         this.documentsPerPage = value;
      },
      
      /**
       * Handles updates to the number of documents to display per page.
       * 
       * @instance
       * @param {object} payload
       */
      onDocumentsPerPageChange: function alfresco_documentlibrary_AlfResultsPerPageGroup__onDocumentsPerPageChange(payload) {
         if (payload && payload.value && payload.value != this.documentsPerPage)
         {
            this.documentsPerPage = payload.value;
            this.alfPublish(this.setPreferenceTopic, {
               preference: "org.alfresco.share.documentList.documentsPerPage",
               value: this.documentsPerPage
            });
         }
      },
      
      /**
       * @instance
       */
      postCreate: function alfresco_documentlibrary_AlfResultsPerPageGroup__postCreate() {
         var label25 = this.message("alf-documentlist-paginator.perPage.label", {0: 25}),
             label50 = this.message("alf-documentlist-paginator.perPage.label", {0: 50}),
             label75 = this.message("alf-documentlist-paginator.perPage.label", {0: 75}),
             label100 = this.message("alf-documentlist-paginator.perPage.label", {0: 100});
         
         this.widgets = [
            {
               name: "alfresco/menus/AlfCheckableMenuItem",
               config: {
                  label: label25,
                  value: 25,
                  group: this.groupName,
                  checked: (this.documentsPerPage == 25),
                  publishTopic: this.docsPerpageSelectionTopic,
                  publishPayload: {
                     label: label25,
                     value: 25
                  }
               }
            },
            {
               name: "alfresco/menus/AlfCheckableMenuItem",
               config: {
                  label: label50,
                  value: 50,
                  group: this.groupName,
                  checked: (this.documentsPerPage == 50),
                  publishTopic: this.docsPerpageSelectionTopic,
                  publishPayload: {
                     label: label50,
                     value: 50
                  }
               }
            },
            {
               name: "alfresco/menus/AlfCheckableMenuItem",
               config: {
                  label: label75,
                  value: 75,
                  group: this.groupName,
                  checked: (this.documentsPerPage == 75),
                  publishTopic: this.docsPerpageSelectionTopic,
                  publishPayload: {
                     label: label75,
                     value: 75
                  }
               }
            },
            {
               name: "alfresco/menus/AlfCheckableMenuItem",
               config: {
                  label: label100,
                  value: 100,
                  group: this.groupName,
                  checked: (this.documentsPerPage == 100),
                  publishTopic: this.docsPerpageSelectionTopic,
                  publishPayload: {
                     label: label100,
                     value: 100
                  }
               }
            }
         ];
         this.inherited(arguments);
      }
   });
});