define(["alfresco/forms/controls/BaseFormControl","dojo/_base/declare","dijit/form/Select","dijit/focus"],function(c,b,f,a){return b([c],{getWidgetConfig:function e(){return{id:this.generateUuid(),name:this.name,value:this.value,options:(this.options!=null)?this.options:[]}},createFormControl:function d(g,h){return new f(g)}})});