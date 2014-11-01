define(["dojo/_base/declare","dijit/_WidgetBase","dijit/_TemplatedMixin","dojo/text!./templates/SlidingTabs.html","dojo/text!./templates/SlidingTabSelector.html","alfresco/core/Core","alfresco/core/ObjectTypeUtils","dojo/_base/lang","dojo/_base/array","dojo/on","dojo/dom-geometry","dojo/string","dojo/dom-construct","dojo/dom-class","dojo/dom-style","dojo/query","dojo/NodeList-dom","dojo/NodeList-traverse"],function(s,b,p,t,k,j,m,u,g,i,r,e,f,h,o,d){return s([b,p,j],{cssRequirements:[{cssFile:"./css/SlidingTabs.css"}],templateString:t,tabTemplateString:k,tabCount:0,contentFrameWidth:1000,postCreate:function l(){o.set(this.contentFrameNode,"width",this.contentFrameWidth+"px");if(m.isArray(this.widgets)){this.processWidgets(this.widgets,this.contentItemsNode)}else{this.alfLog("warn","'widgets' attribute pased was not an array. No tabs will be added",this.widgets)}},processWidget:function q(w,B,x){if(this.filterWidget(B)){if(B.title!=null&&B.title!=""){this.tabCount++;var x=(B.index!=null)?B.index.toString():this.generateIndexText(this.tabCount);var z=(B.className!=null)?B.className.toString():"";var y=f.toDom(e.substitute(k,{tabClass:z,index:x,title:B.title}));i(y,"click",u.hitch(this,"tabSelected",this.tabCount+0));f.place(y,this.navigationNode);o.set(this.contentItemsNode,"width",(this.contentFrameWidth*this.tabCount)+"px");var v=f.create("div",{className:"content-item",style:{width:this.contentFrameWidth+"px"}},w);var A=this.createWidgetDomNode(B,v,B.className);this.createWidget(B,A,this._registerProcessedWidget,this)}else{this.alfLog("warn","Cannot add a widget as a tab without a title",B,this)}}},generateIndexText:function a(v){if(v<10){return"0"+v+"."}else{return v+"."}},allWidgetsProcessed:function c(v){d(".navigation",this.domNode).children().first().addClass("selected").next().addClass("next")},tabSelected:function n(v,w){this.alfLog("log","Tab index selected",v);d(".navigation div.next",this.domNode).removeClass("next");d(w.currentTarget).next().addClass("next");d(".navigation div.selected",this.domNode).removeClass("selected");d(w.currentTarget).addClass("selected");var x="-"+((v-1)*this.contentFrameWidth)+"px";o.set(this.contentItemsNode,"left",x)}})});