// ==UserScript==
// @name            Reviews Overcharged
// @author          Oleg Valter <oleg.a.valter@gmail.com>
// @description     Quality of life improvements for review queues
// @grant           unsafeWindow
// @homepage        https://github.com/userscripters/reviews-overcharged#readme
// @match           https://stackoverflow.com/review/suggested-edits/*
// @match           https://serverfault.com/review/suggested-edits/*
// @match           https://superuser.com/review/suggested-edits/*
// @match           https://*.stackexchange.com/review/suggested-edits/*
// @match           https://askubuntu.com/review/suggested-edits/*
// @match           https://stackapps.com/review/suggested-edits/*
// @match           https://mathoverflow.net/review/suggested-edits/*
// @match           https://pt.stackoverflow.com/review/suggested-edits/*
// @match           https://ja.stackoverflow.com/review/suggested-edits/*
// @match           https://ru.stackoverflow.com/review/suggested-edits/*
// @match           https://es.stackoverflow.com/review/suggested-edits/*
// @match           https://meta.stackoverflow.com/review/suggested-edits/*
// @match           https://meta.serverfault.com/review/suggested-edits/*
// @match           https://meta.superuser.com/review/suggested-edits/*
// @match           https://meta.askubuntu.com/review/suggested-edits/*
// @match           https://meta.mathoverflow.net/review/suggested-edits/*
// @match           https://pt.meta.stackoverflow.com/review/suggested-edits/*
// @match           https://ja.meta.stackoverflow.com/review/suggested-edits/*
// @match           https://ru.meta.stackoverflow.com/review/suggested-edits/*
// @match           https://es.meta.stackoverflow.com/review/suggested-edits/*
// @run-at          document-start
// @source          git+https://github.com/userscripters/reviews-overcharged.git
// @supportURL      https://github.com/userscripters/reviews-overcharged/issues
// @version         2.1.0
// ==/UserScript==

!function r(s,n,a){function o(t,e){if(!n[t]){if(!s[t]){var i="function"==typeof require&&require;if(!e&&i)return i(t,!0);if(c)return c(t,!0);throw(e=new Error("Cannot find module '"+t+"'")).code="MODULE_NOT_FOUND",e}i=n[t]={exports:{}},s[t][0].call(i.exports,function(e){return o(s[t][1][e]||e)},i,i.exports,r,s,n,a)}return n[t].exports}for(var c="function"==typeof require&&require,e=0;e<a.length;e++)o(a[e]);return o}({1:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.selectActions=void 0;r.selectActions=({selectors:e})=>[...document.querySelectorAll(e.title.actions)]},{}],2:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.getSuggestionsUserStats=r.getSuggestionsByPost=r.getSuggestionInfo=void 0;const o=e("./config"),a=e("./utils");r.getSuggestionInfo=async(e,t={})=>{var{site:t=o.DEF_SITE}=t;const r=new URL(`${o.API_BASE}/${o.API_VER}/suggested-edits/`+e),i=(r.search=new URLSearchParams({key:o.API_KEY,site:t}).toString(),await fetch(r.toString()));if(i.ok)return{items:e}=await i.json(),e[0]},r.getSuggestionsByPost=async(e,t={})=>{var{site:t=o.DEF_SITE,type:r="all"}=t;const i=new URL(`${o.API_BASE}/${o.API_VER}/posts/${e}/suggested-edits`),s=(i.search=new URLSearchParams({key:o.API_KEY,site:t}).toString(),await fetch(i.toString()));if(!s.ok)return[];const n=(await s.json())["items"];e={approved:({approval_date:e})=>!!e,rejected:({rejection_date:e})=>!!e,pending:({approval_date:e,rejection_date:t})=>!e&&!t}[r];return e?n.filter(e):n};r.getSuggestionsUserStats=async(e,t,r={})=>{const i=new URL(`${o.API_BASE}/${o.API_VER}/users/${t}/suggested-edits`),s={key:o.API_KEY,site:r.site||o.DEF_SITE};Object.keys(r).length&&({from:t,to:r=new Date}=r,t&&(s.from=(0,a.toApiDate)(t)),r&&(s.to=(0,a.toApiDate)(r))),i.search=new URLSearchParams(s).toString();const n=await fetch(i.toString());if(!n.ok)return[];t=(await n.json()).items;return t}},{"./config":5,"./utils":20}],3:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.addAuditNotification=void 0;r.addAuditNotification=e=>{var e=e["selectors"]["content"],t="audit_notification";if(document.getElementById(t))return!0;const r=document.querySelector(e.typeHint),i=document.querySelector(e.postSummary);if(!r)return!1;const s=document.createElement("blockquote");return s.id=t,s.classList.add("mb12","fs-headline1"),s.textContent="This is an Audit. Tread carefully",r.after(s),r.remove(),null!==i&&void 0!==i&&i.remove(),!0}},{}],4:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.removeExistingSidebars=void 0;const s=e("./utils");r.removeExistingSidebars=e=>{e=e.ids.sidebar.extra;const t=[...document.querySelectorAll(`[id^=${e}]`)];if(t.length<=1)return!0;const r=(0,s.getReviewId)(),i=t.filter(({id:e})=>!e.includes(r));return i.forEach(e=>e.remove()),!0}},{"./utils":20}],5:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.config=r.API_KEY=r.API_VER=r.DEF_SITE=r.API_BASE=void 0;const i=e("./utils");r.API_BASE="https://api.stackexchange.com",r.DEF_SITE="stackoverflow",r.API_VER=2.2,r.API_KEY="7LRwV6M6y9lsj4OFtBej3A((",r.config={script:{name:"Review Overcharged"},page:{suggestionId:(0,i.last)(location.pathname.split("/"))},classes:{grid:{container:"grid",cell:"grid--cell"},visibility:{none:"v-hidden"}},ids:{progress:{span:"progress-ratio"},sidebar:{extra:"extra-info"}},filters:{unsafe:")7tZ5Od"},selectors:{actions:{action:".js-action-radio-parent",disabled:".is-disabled",wrapper:".js-review-actions",sidebar:".js-actions-sidebar",modal:{form:"form[action='/suggested-edits/reject']",votes:{labels:"label[for^=rejection-reason].s-label",counts:".s-badge__votes"}},inputs:{reject:"#review-action-Reject"}},buttons:{submit:".js-review-submit",skip:".js-review-actions:not(.d-none) .js-action-button[value='1']",close:".s-modal--close"},reviews:{done:".js-reviews-done",daily:".js-reviews-per-day"},diffs:{deleted:".full-diff .deleted > div",added:".full-diff .inserted > div"},page:{links:{excerpt:"a.question-hyperlink[href*='/tags']",question:"a[href*='/questions/']",answer:"a.answer-hyperlink"}},content:{typeHint:".js-review-content .fs-title",postSummary:".s-post-summary"},title:{description:".s-page-title--description",actions:".s-page-title--actions a",learnMore:".js-show-modal-from-nav.s-link",title:".s-page-title--text",header:".s-page-title--header"},info:{post:{wrapper:".postcell span"},editor:{card:"a.s-user-card--link"}}}}},{"./utils":20}],6:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.decolorDiff=void 0;r.decolorDiff=e=>{var{added:e,deleted:t}=e.selectors.diffs;const r=document.querySelector(e),i=document.querySelector(t);return!(!r||!i)&&(r.style.backgroundColor="unset",i.style.backgroundColor="unset",!0)}},{}],7:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.createItem=r.createGridCell=void 0;const i=e("./config");r.createGridCell=({classes:e})=>{const t=document.createElement("div");return t.classList.add(e.grid.cell),t};r.createItem=(...e)=>{const t=document.createElement("div");return t.classList.add(i.config.classes.grid.cell,"p12"),t.append(...e),t}},{"./config":5}],8:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.waitForSelector=r.goParentUp=r.arraySelect=void 0;r.arraySelect=(e,t)=>[...e.querySelectorAll(t)],r.goParentUp=(e,t=1)=>0!==t&&e?(0,r.goParentUp)(e.parentElement,t-1):e;r.waitForSelector=(s,n)=>{var e=document.querySelectorAll(s);return e.length?Promise.resolve(e):new Promise((t,e)=>{const r=n&&setTimeout(e,n),i=new MutationObserver(()=>{var e=document.querySelectorAll(s);e.length&&(clearTimeout(r),i.disconnect(),t(e))});i.observe(document,{subtree:!0,childList:!0,attributes:!0})})}},{}],9:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.getSuggestionTotals=r.getEditAuthorId=r.getPostId=r.getEditType=r.getTagName=r.getQuestionId=r.getAnswerId=void 0;const s=e("./config"),i=e("./domUtils"),n=e("./utils");r.getAnswerId=async e=>{var[e]=await(0,i.waitForSelector)(e,1e4);return(0,n.safeMatch)((null==e?void 0:e.href)||"",/\/questions\/\d+\/[\w-]+\/(\d+)/)[0]},r.getQuestionId=async e=>{var[e]=await(0,i.waitForSelector)(e,1e4);return(0,n.safeMatch)((null==e?void 0:e.href)||"",/\/questions\/(\d+)/)[0]},r.getTagName=async e=>{var[e]=await(0,i.waitForSelector)(e,1e3);return(0,n.safeMatch)((null==e?void 0:e.href)||"",/\/tags\/(.+)\/info/)[0]},r.getEditType=async({selectors:e})=>{var[{textContent:e}]=await(0,i.waitForSelector)(e.content.typeHint,1e4);return(0,n.safeMatch)(e||"",/(question|answer)\s+edit/)[0]},r.getPostId=async e=>{var{links:e}=e["selectors"]["page"];return"question"===await(0,r.getEditType)(s.config)?(0,r.getQuestionId)(e.question):(0,r.getAnswerId)(e.answer)},r.getEditAuthorId=()=>{var e=s.config.selectors.info.post.wrapper,t=document.querySelectorAll(e);if(!t.length)return(0,n.handleMatchFailure)(e,null);e=Array.from(t).find(({textContent:e})=>/proposed/i.test(e||""));if(!e)return null;t=s.config.selectors.info.editor.card;const r=e["parentElement"];e=r.querySelector(t);if(!e)return(0,n.handleMatchFailure)(t,null);const i=e["href"];var[,t]=i.match(/users\/(\d+)/)||[];return t||null};r.getSuggestionTotals=e=>{const r={get ratio(){var{approved:e,pending:t,rejected:r,total:i}=this;return{ofApproved:e/i,ofRejected:r/i,ofPending:t/i,approvedToRejected:e/(0===r?1:r)}},get pending(){var{approved:e,rejected:t,total:r}=this;return r-(e+t)},approved:0,rejected:0,total:0};return e.forEach(({approval_date:e,rejection_date:t})=>{r.total+=1,e&&(r.approved+=1),t&&(r.rejected+=1)}),r}},{"./config":5,"./domUtils":8,"./utils":20}],10:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.LineGraph=r.GraphGrid=r.GraphGridLine=r.GraphAxis=r.AxisLabelLine=r.AxisLabel=r.AxisLine=r.GraphSerie=r.Point=void 0;const c="http://www.w3.org/2000/svg";class Drawable{destroy(){var e;return null!=(e=this.element)&&e.remove(),this}}class List{constructor(){this.items=[]}push(e){const t=this["items"];return t.push(...e()),t}pop(e){const t=this["items"];return t.splice(t.length-e,e)}}class Point extends Drawable{constructor(e,t,r){super(),this.graph=e,this.serie=t,this.colour="black",this.size=1,this.type="circle";var{y:e,colour:r,size:i,tooltip:s,type:n,id:o}=r,a=t["numPoints"];this.id=o||t.id+`-point-${a}-`+Date.now(),this.y=e,r&&(this.colour=r),i&&(this.size=i),s&&(this.tooltip=s),n&&(this.type=n)}get middle(){var e=this["size"];return e/2}get x(){const{graph:e,serie:t,id:r}=this;return e.pointXshift*t.indexOf(r)}create(){const{colour:e,id:t,tooltip:r,type:i}=this,s={circle:()=>document.createElementNS(c,i),rectangle:()=>document.createElementNS(c,"rect")},n=s[i](),o=(n.id=t,n)["style"];if(o.fill=e,r){const a=document.createElementNS(c,"title");a.textContent=r,n.append(a)}return this.element=n}draw(){var{element:e=this.create(),serie:t}=this;return e.isConnected||null!=(t=t.element)&&t.append(e),this.sync()}sync(){const{element:t=this.create(),graph:e,x:r,y:i,middle:s,size:n,type:o}=this,a={circle:e=>(t.setAttribute("cx",r.toString()),t.setAttribute("cy",(e.height-i).toString()),t.setAttribute("r",s.toString()),this),rectangle:e=>(t.setAttribute("x",(r-s).toString()),t.setAttribute("y",(e.height-i-s).toString()),t.setAttribute("width",n.toString()),t.setAttribute("height",n.toString()),this)};return a[o](e)}}r.Point=Point;class GraphSerie extends List{constructor(e,t){var{id:t,curved:r=!1,size:i,colour:s,points:n}=t;super(),this.graph=e,this.curved=!1,this.colour="black",this.size=1,this.curved=r,this.id=t||"serie-"+e.items.length,i&&(this.size=i),s&&(this.colour=s),n&&this.pushPoints(...n)}get numPoints(){var e=this["items"];return e.length}get lastPoint(){var e=this["numPoints"];return this.pointAt(e-1)}indexOf(t){const e=this["items"];return e.findIndex(e=>e.id===t)}pointAt(e){var t=this["items"];return t[e]}pointById(t){const e=this["items"];return e.find(e=>e.id===t)}pushPoints(...e){const{colour:r,graph:i}=this;return this.push(()=>e.map(e=>{var{colour:t=r}=e;return new Point(i,this,{colour:t,...e})}))}shift(){const e=this["items"],t=e.shift();return null===t||void 0===t?void 0:t.destroy()}create(){const{size:e,colour:t,id:r}=this,i=document.createElementNS(c,"g"),s=document.createElementNS(c,"path"),n=(s.id=r,s)["style"];return n.fill="none",n.stroke=t,n.strokeWidth=e.toString(),i.append(s),this.element=i}draw(){var{element:e=this.create(),graph:t}=this;return this.items.forEach(e=>e.draw()),null!=(t=t.element)&&t.append(e),this.sync()}sync(){var e;const{element:t=this.create(),items:s,graph:r,curved:n}=this;if(s.length<2)return this;const o=r["height"],[i,...a]=s,c=a.reduce((e,t,r)=>{var r=s[r],i=t.x+","+(o-t.y);return e+" "+(n?`S ${(t.x+r.x)/2},${o-t.y},`+i:"L "+i)},`M ${i.x},`+(o-i.y));return null!=(e=t.querySelector("path"))&&e.setAttribute("d",c.trim()),this}}r.GraphSerie=GraphSerie;class AxisLine extends Drawable{constructor(e,t){super(),this.graph=e,this.colour="black",this.type="horizontal";var{colour:e,type:t}=t;e&&(this.colour=e),t&&(this.type=t)}createPointer(){var e=this["colour"];const t=document.createElementNS(c,"path");return t.setAttribute("fill",e),t}create(){var e=this["colour"];const t=document.createElementNS(c,"g");var r=this.createPointer(),i=document.createElementNS(c,"line");const s=i["style"];return s.stroke=e,t.append(i,r),this.element=t}draw(){return this.element||this.create(),this.sync()}sync(){const{element:e=this.create(),graph:t,type:r}=this,{width:i,height:s}=t,n=e.querySelector("line"),o=e.querySelector("path");return"horizontal"===r&&(null!==n&&void 0!==n&&n.setAttribute("x1","0"),null!==n&&void 0!==n&&n.setAttribute("x2",i.toString()),null!==n&&void 0!==n&&n.setAttribute("y1",s.toString()),null!==n&&void 0!==n&&n.setAttribute("y2",s.toString()),null!==o&&void 0!==o&&o.setAttribute("d",`M ${i-2} ${s-2} L ${i} ${s} L ${i-2} ${s+2} z`)),"vertical"===r&&(null!==n&&void 0!==n&&n.setAttribute("x1","0"),null!==n&&void 0!==n&&n.setAttribute("x2","0"),null!==n&&void 0!==n&&n.setAttribute("y1","0"),null!==n&&void 0!==n&&n.setAttribute("y2",s.toString()),null!==o&&void 0!==o&&o.setAttribute("d","M -2 2 L 0 -2 L 2 2 z")),this}}r.AxisLine=AxisLine;class AxisLabel extends Drawable{constructor(e,t,r){super(),this.graph=e,this.line=t,this.colour="black",this.rotate=0,this.size=10;var{colour:e,rotate:r,size:i,text:s,id:n}=r;this.id=n||`label-${t.numLabels}-`+Date.now(),this.text=s,this.colour=e||t.colour,r&&(this.rotate=r),i&&(this.size=i)}get index(){const{line:e,id:t}=this;return e.items.findIndex(e=>e.id===t)}create(){var e=this["id"];const t=document.createElementNS(c,"text");return t.id=e,this.element=t}draw(){var{element:e=this.create(),line:t}=this;return e.isConnected||null!=(t=t.element)&&t.append(e),this.sync()}sync(){const{element:e=this.create(),graph:t,line:r,index:i,rotate:s,text:n,colour:o,size:a}=this;var c="number"==typeof a?a+"px":a,{lineSize:l,interval:d}=r,u=0+d*i;const h=t.height+l;return e.setAttribute("x",(u-d/2).toString()),e.setAttribute("y",h.toString()),e.setAttribute("font-size",c),e.setAttribute("fill",o),s&&e.setAttribute("transform",`rotate(${-s},${u},${h})`),e.textContent=n,this}}r.AxisLabel=AxisLabel;class AxisLabelLine extends Drawable{constructor(e,t={}){super(),this.graph=e,this.colour="black",this.items=[],this.rotate=0,this.size=10,this.lineSize=20;var{colour:e,labels:t=[],rotate:r,size:i}=t;this.add(...t),e&&(this.colour=e),r&&(this.rotate=r),i&&(this.size=i)}get interval(){var e=this["graph"];return e.pointXshift}get numLabels(){var e=this["items"];return e.length}add(...e){const{items:t,colour:r,graph:i,size:s,rotate:n}=this;return t.push(...e.map(e=>new AxisLabel(i,this,{text:e,colour:r,size:s,rotate:n}))),this}has(t){const e=this["items"];return e.some(e=>e.text===t)}create(){var e=document.createElementNS(c,"g");return this.element=e}draw(){return this.element||this.create(),this.items.forEach(e=>e.draw()),this.sync()}shift(){const e=this["items"],t=e.shift();return null===t||void 0===t?void 0:t.destroy()}sync(){return this}}r.AxisLabelLine=AxisLabelLine;class GraphAxis extends Drawable{constructor(e,t){super(),this.graph=e,this.makeX=!0,this.makeY=!0,this.size=1;var{makeX:t=!0,makeY:r=!0,size:i=1,colour:s="black",xLabelRotation:n=0,xLabelSize:o=10,xLabelColour:a}=t;this.makeX=t,this.makeY=r,this.size=i,this.xLine=new AxisLine(e,{type:"horizontal",colour:s}),this.yLine=new AxisLine(e,{type:"vertical",colour:s}),this.xLabel=new AxisLabelLine(e,{colour:a||s,rotate:n,size:o})}get numXmarks(){var{graph:e,makeX:t,size:r}=this;if(!e||!t)return 0;t=e.width;return Math.ceil(t/r)-2}get numYmarks(){var{graph:e,makeX:t,size:r}=this;if(!e||!t)return 0;t=e.height;return Math.ceil(t/r)-2}createMark(){}createMarks(e){var{graph:t,numXmarks:r,numYmarks:i}=this;if(t){for(let e=1;e<=r;e++);for(let e=1;e<=i;e++);}}create(){const{size:e,xLabel:t,xLine:r,yLine:i}=this,s=(this.createMarks(e),document.createElementNS(c,"g"));return s.append(r.create(),i.create(),t.create()),this.element=s}draw(){var e;const{makeX:t,makeY:r,xLine:i,yLine:s,xLabel:n,element:o=this.create(),graph:a}=this;return t&&(n.draw(),i.draw()),r&&s.draw(),o.isConnected||null!=(e=a.element)&&e.append(o),this.sync()}sync(){return this}}r.GraphAxis=GraphAxis;class GraphGridLine extends Drawable{constructor(e,t,r){super(),this.graph=e,this.grid=t,this.direction="horizontal";var{colour:e,direction:r,id:i}=r;this.colour=e||t.colour,this.direction=r,this.id=i}get index(){const{grid:e,direction:t,id:r}=this,i="horizontal"===t?e.xLines:e.yLines;return i.findIndex(e=>e.id===r)}create(){var e=document.createElementNS(c,"line");return this.element=e}draw(){var{element:e=this.create(),grid:t}=this;return e.isConnected||null!=(t=t.element)&&t.append(e),this.sync()}sync(){const{grid:e,colour:t,direction:r,index:i,graph:s,element:n=this.create()}=this;var o=e.size*(i+1);const a=n["style"];a.stroke=t,a.strokeWidth="0.5";var{height:c,width:l}=s;const d=l-2,u=c;return"vertical"===r&&(n.setAttribute("x1",2..toString()),n.setAttribute("x2",d.toString()),n.setAttribute("y1",(u-o).toString()),n.setAttribute("y2",(u-o).toString())),"horizontal"===r&&(n.setAttribute("x1",(2+o).toString()),n.setAttribute("x2",(2+o).toString()),n.setAttribute("y1",u.toString()),n.setAttribute("y2",0..toString())),this}}r.GraphGridLine=GraphGridLine;class GraphGrid extends Drawable{constructor(e,t){super(),this.graph=e,this.colour="black",this.size=1,this.xLines=[],this.yLines=[];var{colour:e,size:t,horizontal:r=!1,vertical:i=!1}=t;this.horizontal=r,this.vertical=i,t&&(this.size=t),e&&(this.colour=e)}get numXcells(){var{size:e,graph:t}=this;return Math.ceil(t.width/e)}get numYcells(){var{size:e,graph:t}=this;return Math.ceil(t.height/e)}updateLines(){const{xLines:t,yLines:r,numXcells:i,numYcells:s,graph:n,colour:o}=this;t.forEach(e=>e.destroy()),r.forEach(e=>e.destroy()),t.length=0,r.length=0;for(let e=1;e<i;e++)t.push(new GraphGridLine(n,this,{id:"grid-x-line-"+e,direction:"horizontal",colour:o}));for(let e=1;e<s;e++)r.push(new GraphGridLine(n,this,{id:"grid-y-line-"+e,direction:"vertical",colour:o}))}create(){var e=document.createElementNS(c,"g");return this.element=e}draw(){var e;const{element:t=this.create(),graph:r,xLines:i,yLines:s,vertical:n,horizontal:o}=this;return this.updateLines(),o&&i.forEach(e=>e.draw()),n&&s.forEach(e=>e.draw()),t.isConnected||null!=(e=r.element)&&e.append(t),this.sync()}sync(){return this}}r.GraphGrid=GraphGrid;r.LineGraph=class extends List{constructor({id:e,width:t,height:r,size:i=1,axisColour:s="black",gridColour:n="lightgrey",gridSize:o=2,xAxisGridLines:a=!0,yAxisGridLines:c=!0,xAxisLabelRotation:l=0,xAxisLabelSize:d=10,xAxisLabelColour:u}){super(),this.id=e,this.size=i,this.width=t,this.height=r,this.grid=new GraphGrid(this,{colour:n,horizontal:a,vertical:c,size:o}),this.axis=new GraphAxis(this,{size:i,colour:s,xLabelRotation:l,xLabelSize:d,xLabelColour:u})}get pointXshift(){var{width:e,maxNumPoints:t}=this;return Math.floor(e/t)}get maxNumPoints(){const e=this["items"];return Math.max(...e.map(e=>e.items.length))}pushSeries(...e){const i=this["size"];return this.push(()=>e.map(({points:e=[],...t})=>{const r=new GraphSerie(this,{size:i,...t});return r.pushPoints(...e),r}))}hasXaxisLabel(e){const{xLabel:t}=this["axis"];return t.has(e)}addXaxisLabel(e){const{xLabel:t}=this["axis"];return t.add(e),this}shiftXaxisLabels(){const{xLabel:e}=this["axis"];return e.shift()}shift(){const e=this["items"];return this.shiftXaxisLabels(),e.forEach(e=>e.shift()),this}create(){var e=this["id"];const t=document.createElementNS(c,"svg");return t.setAttribute("id",e),this.element=t}destroy(){var e;return null!=(e=this.element)&&e.remove(),this}draw(){const{grid:e,axis:t,items:r}=this;return this.element||this.create(),t.draw(),e.draw(),r.forEach(e=>e.draw()),this.sync()}sync(){const{width:e,height:t,element:r=this.create()}=this;return r.setAttribute("width",e.toString()),r.setAttribute("height",t.toString()),r.setAttribute("viewBox",`-2 -2 ${e+2} `+(t+4+30)),this}}},{}],11:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.isTagEdit=void 0;const i=e("./getters");r.isTagEdit=async e=>{try{return!!await(0,i.getTagName)(e.selectors.page.links.excerpt)}catch(e){return!1}}},{"./getters":9}],12:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0});const u=e("./api"),h=e("./audits"),p=e("./cleanup"),g=e("./config"),m=e("./diffs"),v=e("./guards"),f=e("./progress"),y=e("./reports"),b=e("./stats"),S=e("./title");window.addEventListener("load",async()=>{let r=!1,i;$(document).ajaxComplete((e,t)=>{t=t.responseJSON;"object"==typeof t&&t&&(i=t.suggestedEditId,r=t.isAudit)});const t="ReviewOvercharged";const s=new class{constructor(e){this.handlers=e}get names(){var e=this["handlers"];return Object.keys(e)}get actors(){var e=this["handlers"];return Object.values(e)}runAll(t){const e=this["actors"];return Promise.all(e.map(e=>e(t)))}}({moveProgressToTabs:f.moveProgressToTabs,optimizePageTitle:S.optimizePageTitle,decolorDiff:m.decolorDiff});var e=await(0,v.isTagEdit)(g.config),n=e||!i?void 0:await(0,u.getSuggestionInfo)(i);if(console.debug(`[${t}] suggested edit id: `+i),!n&&!e){const a=await s.runAll(g.config);return(0,y.reportHandlersStatus)(t,s.names,a),void(r&&(0,h.addAuditNotification)(g.config))}Object.assign(s.handlers,{addStatsSidebar:b.addStatsSidebar});const o=[p.removeExistingSidebars],a=await s.runAll(g.config),{actions:{wrapper:c}}=((0,y.reportHandlersStatus)(t,s.names,a),await(0,b.addMyStatsSidebar)(g.config),g.config)["selectors"],l=[Node.TEXT_NODE,Node.COMMENT_NODE],d=new MutationObserver(async e=>{e.find(({addedNodes:e})=>[...e].some(t=>l.every(e=>e!==t.nodeType)&&t.matches(c)))&&(e=await s.runAll(g.config),(0,y.reportHandlersStatus)(t,s.names,e),r&&(0,h.addAuditNotification)(g.config),await Promise.all(o.map(e=>e(g.config))))});d.observe(document,{subtree:!0,childList:!0})})},{"./api":2,"./audits":3,"./cleanup":4,"./config":5,"./diffs":6,"./guards":11,"./progress":13,"./reports":15,"./stats":16,"./title":18}],13:[function(e,t,l){"use strict";Object.defineProperty(l,"__esModule",{value:!0}),l.moveProgressToTabs=l.hideProgressBar=void 0;const d=e("./actions"),i=e("./domUtils"),u=e("./utils");l.hideProgressBar=({classes:{visibility:e}},t)=>{const r=(0,i.goParentUp)(t,3);return!!r&&(r.classList.add(e.none),!0)};l.moveProgressToTabs=e=>{var{ids:{progress:{span:t}},selectors:{reviews:r}}=e;const i=(0,d.selectActions)(e);var s=i.find(({href:e})=>/\/review\/suggested-edits/.test(e)),n=document.querySelector(r.daily),r=document.querySelector(r.done);if(!n||!r)return!1;var o=+(0,u.trimNumericString)(n.textContent||"0"),r=+(0,u.trimNumericString)(r.textContent||"0"),a=r/o,a=(0,u.toPercent)(a);if(!s)return!1;const c=s["style"];c.background=`linear-gradient(90deg, var(--theme-primary-color) ${a}, var(--black-075) ${a})`,c.color="var(--black-600)";a=document.getElementById(t)||(({ids:{progress:e}},t)=>{const r=document.createElement("span");return r.id=e.span,t.append(r),r})(e,s);return a.innerHTML=`&nbsp;(${r}/${o})`,(0,l.hideProgressBar)(e,n)}},{"./actions":1,"./domUtils":8,"./utils":20}],14:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.getRejectionCount=void 0;const l=e("./domUtils"),d=e("./utils");r.getRejectionCount=async e=>{var{modal:t}=e["selectors"]["actions"],e=await(async e=>{var{buttons:e,actions:{inputs:t,modal:r,action:i,disabled:s}}=e["selectors"];const n=document.querySelector(t.reject),o=document.querySelector(e.submit);if(!n||!o)return null;await(0,l.waitForSelector)(i+`:not(${s})`),n.click(),o.click();const a=[...await(0,l.waitForSelector)(r.form)][0];if(!a)return(0,d.handleMatchFailure)(r.form,null);t=a.cloneNode(!0);const c=a.querySelector(e.close);return c.click(),t})(e);if(!e)return(0,d.handleMatchFailure)(t.form,null);const r=(0,l.arraySelect)(e,t.votes.labels),i={vandalism:0,improvement:0,intent:0,reply:0,harm:0,guidance:0,copyright:0,circular:0},s={102:"improvement",101:"vandalism",104:"intent",105:"reply",106:"copyright",107:"guidance",110:"circular",0:"harm"},n=t.votes.counts;return r.forEach(e=>{const t=e["htmlFor"];var[,r]=t.match(/(\d+$)/)||[],r=s[r];e.querySelector(n)&&(i[r]+=1)}),i}},{"./domUtils":8,"./utils":20}],15:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.reportHandlersStatus=void 0;r.reportHandlersStatus=(e,i,t)=>{t=t.reduce((e,t,r)=>`${e}
${i[r]} - `+(t?"success":"failure"),`[${e}] handler run:`);console.debug(t)}},{}],16:[function(e,t,S){"use strict";Object.defineProperty(S,"__esModule",{value:!0}),S.addMyStatsSidebar=S.getDailyReviewerStats=S.addStatsSidebar=S.createRejectionCountItem=S.createEditorStatsItem=S.createEditAuthorItem=void 0;const c=e("./api"),a=e("./config"),h=e("./dom"),w=e("./domUtils"),p=e("./getters"),x=e("./graphs"),l=e("./rejections"),g=e("./templaters"),d=e("./users"),A=e("./utils");S.createEditAuthorItem=({display_name:e,reputation:t,link:r})=>{const i=(0,g.p)("Name: ");return i.append((0,g.a)(r,e)),(0,h.createItem)((0,g.ul)({header:"Edit Author",items:[i,"Reputation: "+t]}))},S.createEditorStatsItem=({link:e},t)=>{const{approved:r,pending:i,rejected:s,total:n,ratio:{approvedToRejected:o,ofApproved:a,ofPending:c,ofRejected:l}}=(0,p.getSuggestionTotals)(t),d={header:"Author Stats",items:[]};if(n)return d.items.push(`Approved: ${r} (${(0,A.toPercent)(a,2)})`,`Rejected: ${s} (${(0,A.toPercent)(l,2)})`,`Pending: ${i} (${(0,A.toPercent)(c,2)})`,"Of total: "+n,"Ratio: "+o.toFixed(1)),(0,h.createItem)((0,g.ul)(d));{const u=(0,g.p)("Tag wiki/excerpt edits are not returned.");return u.append((0,g.br)(),(0,g.text)("See their "),(0,g.a)(e+"?tab=activity&sort=suggestions","activity tab")),d.items.push(u),(0,h.createItem)((0,g.ul)(d))}},S.createRejectionCountItem=e=>{const t=Object.entries(e).filter(([,e])=>!!e),r=t.map(([e,t])=>(0,A.scase)(e)+": "+t);return r.length||r.push("No reject votes"),(0,h.createItem)((0,g.ul)({items:r,header:"Reject votes"}))};S.addStatsSidebar=async e=>{const t=document.querySelector(e.selectors.actions.sidebar);if(!t)return!1;const r=document.createElement("div"),i=(r.classList.add("s-sidebarwidget","ps-sticky","t64","ml24","mt24","ws3"),r.id=e.ids.sidebar.extra+"-"+(0,A.getReviewId)(),document.createElement("div")),s=(i.classList.add("s-sidebarwidget--header"),i.textContent="Extra Info",document.createElement("div"));s.classList.add(e.classes.grid.container,"fd-column");var n=(0,p.getEditAuthorId)(),o=await(0,l.getRejectionCount)(e);if(!o)return!1;const a=[];return n&&([e,n]=await Promise.all([(0,d.getUserInfo)(e,n),(0,c.getSuggestionsUserStats)(e,n)]),e&&a.push((0,S.createEditAuthorItem)(e),(0,S.createEditorStatsItem)(e,n))),a.push((0,S.createRejectionCountItem)(o)),s.append(...a),r.append(i,s),t.append(r),!0};const m=["approve","edit","reject","reject and edit","skip"];S.getDailyReviewerStats=async(l,d,e={})=>{const{pageNum:t=1,maxPage:r=10}=e,u=new Map;if(t>=r)return console.debug(`[${l}] reached max page (${r}) for daily stats`),u;var i=new URL(location.origin+"/review/suggested-edits/history");const s=i["searchParams"],n=(s.set("userid",d.toString()),s.set("skipped","true"),s.set("page",t.toString()),await fetch(i,{credentials:"include"}));if(!n.ok)return console.debug(`[${l}] failed to get: `+i),u;const o=$(await n.text()),a=o.find("#content table > tbody > tr");if(!a.length)return u;a.each((e,t)=>{var t=t["cells"];const[r,,i,s]=t;var n,t=null==(t=i.textContent)?void 0:t.trim().toLowerCase(),o=null==(o=s.querySelector("span"))?void 0:o.title.slice(0,10),a=Number(null==(a=r.querySelector("a"))?void 0:a.href.replace(/.*?users\/(\d+)\/.*/,"$1"));if(t&&o&&a)if(n=t,m.some(e=>e===n))if(a!==d)console.debug(`[${l}] skipping non-matching uid: `+a);else{u.has(o)||u.set(o,{approve:0,edit:0,reject:0,"reject and edit":0,skip:0});const c=u.get(o);c?c[t]+=1:console.debug(`[${l}] missing daily stat for `+o)}else console.debug(`[${l}] not a review action: `+t);else console.debug(`[${l}] malformed review row: ${o} ${t} `+a)}),await(0,A.delay)(2010);const c=await(0,S.getDailyReviewerStats)(l,d,{...e,pageNum:t+1});return c.forEach((e,t)=>{const r=u.get(t);if(r)return r.approve+=e.approve,r.reject+=e.reject,void(r.skip+=e.skip);u.set(t,e)}),u};const L=(e,t,r)=>{var i,s=(new Date).toISOString().slice(0,10),n=(e.hasXaxisLabel(s)||e.addXaxisLabel(s),t.id+"-"+s);const o=t.pointById(n);if(o)return i=o.y+1,o.y=i,o.tooltip=(0,A.pluralize)(i,"skip")+" on "+s,void e.draw();t.pushPoints({...r,y:1,id:n,tooltip:(0,A.pluralize)(1,"skip")+" on "+s}),10<e.maxNumPoints&&e.shift(),e.draw()};S.addMyStatsSidebar=async r=>{const e=document.querySelector(a.config.selectors.actions.sidebar);if(!e)return!1;const i=document.createElement("div"),t=(i.classList.add("s-sidebarwidget","ps-sticky","t64","ml24","mt24","ws3"),i.id=r.script.name+"-my-stats",document.createElement("div")),s=(t.classList.add("s-sidebarwidget--header"),t.textContent="My Stats",document.createElement("div")),n=(s.classList.add("grid","fd-column"),document.createElement("div"));n.classList.add("grid--cell","p12"),s.append(n),i.append(t,s);const c=new x.LineGraph({id:"reviewer-daily-stats",height:180,width:290,gridColour:"var(--black-600)",gridSize:20,xAxisGridLines:!1,xAxisLabelRotation:30,xAxisLabelSize:8,xAxisLabelColour:"var(--black-400)"}),o=(n.append(c.draw().element),e.append(i),new MutationObserver(e=>{e.map(async({removedNodes:e})=>{if([...e].includes(i)){const[t]=await(0,w.waitForSelector)(`[id^=${r.ids.sidebar.extra}]`);t.after(i)}})}));o.observe(document,{childList:!0,subtree:!0});var l={curved:!0};const[d,u,h,p,g]=c.pushSeries({...l,colour:"var(--green-500)",id:"approve"},{...l,colour:"var(--gold)",id:"edit"},{...l,colour:"var(--red-500)",id:"reject"},{...l,colour:"var(--orange-500)",id:"reject-edit"},{...l,colour:"var(--blue-600)",id:"skip"});l=StackExchange.options.user.userId;if(l){const m=[...await(0,S.getDailyReviewerStats)(r.script.name,l)].sort(([e],[t])=>e<t?-1:1),v={size:5,type:"circle"};let a=160;m.forEach(([e,t])=>{c.addXaxisLabel(e);var{approve:t,edit:r,reject:i,skip:s,"reject and edit":n}=t,o=(a=Math.max(a,t,r,i,s,n)," on "+e);d.pushPoints({...v,y:t,id:d.id+"-"+e,tooltip:(0,A.pluralize)(t,"approval")+o}),u.pushPoints({...v,y:r,id:u.id+"-"+e,tooltip:(0,A.pluralize)(r,"improvement")+o}),h.pushPoints({...v,y:i,id:h.id+"-"+e,tooltip:(0,A.pluralize)(i,"rejection")+o}),p.pushPoints({...v,y:n,id:p.id+"-"+e,tooltip:(0,A.pluralize)(n,"reject & edit")+o}),g.pushPoints({...v,y:s,id:g.id+"-"+e,tooltip:(0,A.pluralize)(s,"skip")+o})}),c.height=a+20,c.draw();const f=(0,A.normalizeDatasetPropName)(r.script.name+"-graph-skip-serie"),y=new MutationObserver(()=>{const e=document.querySelector(r.selectors.buttons.skip);var t="ready"===(null===e||void 0===e?void 0:e.dataset[f]);e&&!t&&(e.dataset[f]="ready",e.addEventListener("click",()=>{L(c,g,v)}))}),b=(y.observe(document,{childList:!0,subtree:!0}),new Map);b.set("3",h),$(document).ajaxComplete((e,t,{url:r=""})=>{var[r]=(0,A.safeMatch)(r,/\/suggested-edit\/\d+\/vote\/(\d+)/),r=b.get(r);r&&L(c,r,v)})}return!0}},{"./api":2,"./config":5,"./dom":7,"./domUtils":8,"./getters":9,"./graphs":10,"./rejections":14,"./templaters":17,"./users":19,"./utils":20}],17:[function(e,t,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.ul=n.text=n.p=n.li=n.br=n.a=void 0;n.a=(e,t=e)=>{const r=document.createElement("a");return r.href=e,r.textContent=t,r.target="_blank",r.referrerPolicy="no-referrer",r},n.br=()=>document.createElement("br"),n.li=e=>{const t=document.createElement("li");return"string"==typeof e?t.textContent=e:t.append(e),t},n.p=e=>{const t=document.createElement("p");return t.style.marginBottom="0",t.innerText=e,t},n.text=e=>document.createTextNode(e);n.ul=({header:e,items:t})=>{const r=document.createElement("ul"),i=r["style"];if(i.listStyle="none",i.margin="0",e){const s=document.createElement("h3");s.classList.add("mb8"),s.textContent=e,r.append(s)}e=t.map(n.li);return r.append(...e),r}},{}],18:[function(e,t,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.optimizePageTitle=n.removeTitleLines=void 0;const o=e("./dom"),a=e("./utils");n.removeTitleLines=(e,t)=>(t||document).querySelectorAll(e.selectors.title.description).forEach(e=>e.remove());n.optimizePageTitle=e=>{var t=e.selectors.title.title;const r=document.querySelector(t);if(!r)return(0,a.handleMatchFailure)(t,!1);r.classList.add(e.classes.grid.container);t=document.querySelector(e.selectors.title.header);const i=(0,o.createGridCell)(e);i.classList.add("ml12"),t&&i.append(t);t=r.querySelector(e.selectors.title.learnMore);const s=i.cloneNode();return t&&s.append(t),(0,n.removeTitleLines)(e,r),r.append(i,s),!0}},{"./dom":7,"./utils":20}],19:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.getUserInfo=void 0;const n=e("./config");r.getUserInfo=async({filters:{unsafe:e}},t,r=n.DEF_SITE)=>{const i=new URL(`${n.API_BASE}/${n.API_VER}/users/`+t),s=(i.search=new URLSearchParams({filter:e,key:n.API_KEY,site:r}).toString(),await fetch(i.toString()));if(!s.ok)return null;var[t]=(await s.json())["items"];return t}},{"./config":5}],20:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.normalizeDatasetPropName=r.pluralize=r.delay=r.getReviewId=r.trimNumericString=r.toPercent=r.toApiDate=r.scase=r.safeMatch=r.last=r.handleMatchFailure=void 0;r.handleMatchFailure=(e,t)=>(console.debug("Couldn't find the element with selector: "+e),t),r.last=e=>e[e.length-1],r.safeMatch=(e,t,r="")=>(e.match(t)||[e,r]).slice(1),r.scase=e=>e[0].toUpperCase()+e.slice(1).toLowerCase(),r.toApiDate=e=>(e.valueOf()/1e3).toString(),r.toPercent=(e,t=0)=>{const r=100*e;return r.toFixed(r!==Math.trunc(r)?t:0)+"%"},r.trimNumericString=e=>e.replace(/\D/g,""),r.getReviewId=()=>(0,r.last)(location.href.split("/")),r.delay=(t=100)=>new Promise(e=>{setTimeout(e,t)}),r.pluralize=(e,t,r=t+"s")=>e+" "+(1===e?t:r);r.normalizeDatasetPropName=e=>e.split(/[\s-]+/g).map(e=>e[0].toUpperCase()+e.slice(1).toLowerCase()).join("")},{}]},{},[12]);