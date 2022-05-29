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
// @version         2.0.0
// ==/UserScript==

!function r(n,i,a){function o(t,e){if(!i[t]){if(!n[t]){var s="function"==typeof require&&require;if(!e&&s)return s(t,!0);if(c)return c(t,!0);throw(e=new Error("Cannot find module '"+t+"'")).code="MODULE_NOT_FOUND",e}s=i[t]={exports:{}},n[t][0].call(s.exports,function(e){return o(n[t][1][e]||e)},s,s.exports,r,n,i,a)}return i[t].exports}for(var c="function"==typeof require&&require,e=0;e<a.length;e++)o(a[e]);return o}({1:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.selectActions=void 0;r.selectActions=({selectors:e})=>[...document.querySelectorAll(e.title.actions)]},{}],2:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.getSuggestionsUserStats=r.getSuggestionsByPost=r.getSuggestionInfo=void 0;const i=e("./config"),a=e("./utils");r.getSuggestionInfo=async(e,t={})=>{var{site:t=i.DEF_SITE}=t;const r=new URL(`${i.API_BASE}/${i.API_VER}/suggested-edits/`+e),s=(r.search=new URLSearchParams({site:t}).toString(),await fetch(r.toString()));if(s.ok)return{items:e}=await s.json(),e[0]},r.getSuggestionsByPost=async(e,t={})=>{var{site:t=i.DEF_SITE,type:r="all"}=t;const s=new URL(`${i.API_BASE}/${i.API_VER}/posts/${e}/suggested-edits`),o=(s.search=new URLSearchParams({site:t}).toString(),await fetch(s.toString()));if(!o.ok)return[];const n=(await o.json())["items"];e={approved:({approval_date:e})=>!!e,rejected:({rejection_date:e})=>!!e,pending:({approval_date:e,rejection_date:t})=>!e&&!t}[r];return e?n.filter(e):n};r.getSuggestionsUserStats=async(e,t,r={})=>{const s=new URL(`${i.API_BASE}/${i.API_VER}/users/${t}/suggested-edits`),o={site:r.site||i.DEF_SITE};Object.keys(r).length&&({from:t,to:r=new Date}=r,t&&(o.from=(0,a.toApiDate)(t)),r&&(o.to=(0,a.toApiDate)(r))),s.search=new URLSearchParams(o).toString();const n=await fetch(s.toString());if(!n.ok)return[];t=(await n.json()).items;return t}},{"./config":5,"./utils":19}],3:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.addAuditNotification=void 0;r.addAuditNotification=e=>{var e=e["selectors"]["content"],t="audit_notification";if(document.getElementById(t))return!0;const r=document.querySelector(e.typeHint),s=document.querySelector(e.postSummary);if(!r)return!1;const o=document.createElement("blockquote");return o.id=t,o.classList.add("mb12","fs-headline1"),o.textContent="This is an Audit. Tread carefully",r.after(o),r.remove(),null!==s&&void 0!==s&&s.remove(),!0}},{}],4:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.removeExistingSidebars=void 0;const o=e("./utils");r.removeExistingSidebars=e=>{e=e.ids.sidebar.extra;const t=[...document.querySelectorAll(`[id^=${e}]`)];if(t.length<=1)return!0;const r=(0,o.getReviewId)(),s=t.filter(({id:e})=>!e.includes(r));return s.forEach(e=>e.remove()),!0}},{"./utils":19}],5:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.config=r.API_VER=r.DEF_SITE=r.API_BASE=void 0;const s=e("./utils");r.API_BASE="https://api.stackexchange.com",r.DEF_SITE="stackoverflow",r.API_VER=2.2,r.config={page:{suggestionId:(0,s.last)(location.pathname.split("/"))},classes:{grid:{container:"grid",cell:"grid--cell"},visibility:{none:"v-hidden"}},ids:{progress:{span:"progress-ratio"},sidebar:{extra:"extra-info"}},filters:{unsafe:")7tZ5Od"},selectors:{actions:{action:".js-action-radio-parent",disabled:".is-disabled",wrapper:".js-review-actions",sidebar:".js-actions-sidebar",modal:{form:"form[action='/suggested-edits/reject']",votes:{labels:"label[for^=rejection-reason].s-label",counts:".s-badge__votes"}},inputs:{reject:"#review-action-Reject"}},buttons:{submit:".js-review-submit",skip:".js-review-actions:not(.d-none) .js-action-button[value=1]",close:".s-modal--close"},reviews:{done:".js-reviews-done",daily:".js-reviews-per-day"},diffs:{deleted:".full-diff .deleted > div",added:".full-diff .inserted > div"},page:{links:{excerpt:"a.question-hyperlink[href*='/tags']",question:"a[href*='/questions/']",answer:"a.answer-hyperlink"}},content:{typeHint:".js-review-content .fs-title",postSummary:".s-post-summary"},title:{description:".s-page-title--description",actions:".s-page-title--actions a",learnMore:".js-show-modal-from-nav.s-link",title:".s-page-title--text",header:".s-page-title--header"},info:{post:{wrapper:".postcell span"},editor:{card:"a.s-user-card--link"}}}}},{"./utils":19}],6:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.decolorDiff=void 0;r.decolorDiff=e=>{var{added:e,deleted:t}=e.selectors.diffs;const r=document.querySelector(e),s=document.querySelector(t);return!(!r||!s)&&(r.style.backgroundColor="unset",s.style.backgroundColor="unset",!0)}},{}],7:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.createItem=r.createGridCell=void 0;const s=e("./config");r.createGridCell=({classes:e})=>{const t=document.createElement("div");return t.classList.add(e.grid.cell),t};r.createItem=(...e)=>{const t=document.createElement("div");return t.classList.add(s.config.classes.grid.cell,"p12"),t.append(...e),t}},{"./config":5}],8:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.waitForSelector=r.goParentUp=r.arraySelect=void 0;r.arraySelect=(e,t)=>[...e.querySelectorAll(t)],r.goParentUp=(e,t=1)=>0!==t&&e?(0,r.goParentUp)(e.parentElement,t-1):e;r.waitForSelector=(o,n)=>{var e=document.querySelectorAll(o);return e.length?Promise.resolve(e):new Promise((t,e)=>{const r=n&&setTimeout(e,n),s=new MutationObserver(()=>{var e=document.querySelectorAll(o);e.length&&(clearTimeout(r),s.disconnect(),t(e))});s.observe(document,{subtree:!0,childList:!0,attributes:!0})})}},{}],9:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.getSuggestionTotals=r.getEditAuthorId=r.getPostId=r.getEditType=r.getTagName=r.getQuestionId=r.getAnswerId=void 0;const o=e("./config"),s=e("./domUtils"),n=e("./utils");r.getAnswerId=async e=>{var[e]=await(0,s.waitForSelector)(e,1e4);return(0,n.safeMatch)((null==e?void 0:e.href)||"",/\/questions\/\d+\/[\w-]+\/(\d+)/)[0]},r.getQuestionId=async e=>{var[e]=await(0,s.waitForSelector)(e,1e4);return(0,n.safeMatch)((null==e?void 0:e.href)||"",/\/questions\/(\d+)/)[0]},r.getTagName=async e=>{var[e]=await(0,s.waitForSelector)(e,1e3);return(0,n.safeMatch)((null==e?void 0:e.href)||"",/\/tags\/(.+)\/info/)[0]},r.getEditType=async({selectors:e})=>{var[{textContent:e}]=await(0,s.waitForSelector)(e.content.typeHint,1e4);return(0,n.safeMatch)(e||"",/(question|answer)\s+edit/)[0]},r.getPostId=async e=>{var{links:e}=e["selectors"]["page"];return"question"===await(0,r.getEditType)(o.config)?(0,r.getQuestionId)(e.question):(0,r.getAnswerId)(e.answer)},r.getEditAuthorId=()=>{var e=o.config.selectors.info.post.wrapper,t=document.querySelectorAll(e);if(!t.length)return(0,n.handleMatchFailure)(e,null);e=Array.from(t).find(({textContent:e})=>/proposed/i.test(e||""));if(!e)return null;t=o.config.selectors.info.editor.card;const r=e["parentElement"];e=r.querySelector(t);if(!e)return(0,n.handleMatchFailure)(t,null);const s=e["href"];var[,t]=s.match(/users\/(\d+)/)||[];return t||null};r.getSuggestionTotals=e=>{const r={get ratio(){var{approved:e,pending:t,rejected:r,total:s}=this;return{ofApproved:e/s,ofRejected:r/s,ofPending:t/s,approvedToRejected:e/(0===r?1:r)}},get pending(){var{approved:e,rejected:t,total:r}=this;return r-(e+t)},approved:0,rejected:0,total:0};return e.forEach(({approval_date:e,rejection_date:t})=>{r.total+=1,e&&(r.approved+=1),t&&(r.rejected+=1)}),r}},{"./config":5,"./domUtils":8,"./utils":19}],10:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.isTagEdit=void 0;const s=e("./getters");r.isTagEdit=async e=>{try{return!!await(0,s.getTagName)(e.selectors.page.links.excerpt)}catch(e){return!1}}},{"./getters":9}],11:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0});const u=e("./api"),g=e("./audits"),p=e("./cleanup"),f=e("./config"),m=e("./diffs"),v=e("./guards"),h=e("./progress"),y=e("./reports"),S=e("./stats"),b=e("./title");window.addEventListener("load",async()=>{let r=!1,s;$(document).ajaxComplete((e,t)=>{t=t.responseJSON;"object"==typeof t&&t&&(s=t.suggestedEditId,r=t.isAudit)});const t="ReviewOvercharged";const o=new class{constructor(e){this.handlers=e}get names(){var e=this["handlers"];return Object.keys(e)}get actors(){var e=this["handlers"];return Object.values(e)}runAll(t){const e=this["actors"];return Promise.all(e.map(e=>e(t)))}}({moveProgressToTabs:h.moveProgressToTabs,optimizePageTitle:b.optimizePageTitle,decolorDiff:m.decolorDiff});var e=await(0,v.isTagEdit)(f.config),n=e||!s?void 0:await(0,u.getSuggestionInfo)(s);if(console.debug(`[${t}] suggested edit id: `+s),!n&&!e){const a=await o.runAll(f.config);return(0,y.reportHandlersStatus)(t,o.names,a),void(r&&(0,g.addAuditNotification)(f.config))}Object.assign(o.handlers,{addStatsSidebar:S.addStatsSidebar});const i=[p.removeExistingSidebars],a=await o.runAll(f.config),{actions:{wrapper:c}}=((0,y.reportHandlersStatus)(t,o.names,a),f.config)["selectors"],d=[Node.TEXT_NODE,Node.COMMENT_NODE],l=new MutationObserver(async e=>{e.find(({addedNodes:e})=>[...e].some(t=>d.every(e=>e!==t.nodeType)&&t.matches(c)))&&(e=await o.runAll(f.config),(0,y.reportHandlersStatus)(t,o.names,e),r&&(0,g.addAuditNotification)(f.config),await Promise.all(i.map(e=>e(f.config))))});l.observe(document,{subtree:!0,childList:!0})})},{"./api":2,"./audits":3,"./cleanup":4,"./config":5,"./diffs":6,"./guards":10,"./progress":12,"./reports":14,"./stats":15,"./title":17}],12:[function(e,t,d){"use strict";Object.defineProperty(d,"__esModule",{value:!0}),d.moveProgressToTabs=d.hideProgressBar=void 0;const l=e("./actions"),s=e("./domUtils"),u=e("./utils");d.hideProgressBar=({classes:{visibility:e}},t)=>{const r=(0,s.goParentUp)(t,3);return!!r&&(r.classList.add(e.none),!0)};d.moveProgressToTabs=e=>{var{ids:{progress:{span:t}},selectors:{reviews:r}}=e;const s=(0,l.selectActions)(e);var o=s.find(({href:e})=>/\/review\/suggested-edits/.test(e)),n=document.querySelector(r.daily),r=document.querySelector(r.done);if(!n||!r)return!1;var i=+(0,u.trimNumericString)(n.textContent||"0"),r=+(0,u.trimNumericString)(r.textContent||"0"),a=r/i,a=(0,u.toPercent)(a);if(!o)return!1;const c=o["style"];c.background=`linear-gradient(90deg, var(--theme-primary-color) ${a}, var(--black-075) ${a})`,c.color="var(--black-600)";a=document.getElementById(t)||(({ids:{progress:e}},t)=>{const r=document.createElement("span");return r.id=e.span,t.append(r),r})(e,o);return a.innerHTML=`&nbsp;(${r}/${i})`,(0,d.hideProgressBar)(e,n)}},{"./actions":1,"./domUtils":8,"./utils":19}],13:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.getRejectionCount=void 0;const d=e("./domUtils"),l=e("./utils");r.getRejectionCount=async e=>{var{modal:t}=e["selectors"]["actions"],e=await(async e=>{var{buttons:e,actions:{inputs:t,modal:r,action:s,disabled:o}}=e["selectors"];const n=document.querySelector(t.reject),i=document.querySelector(e.submit);if(!n||!i)return null;await(0,d.waitForSelector)(s+`:not(${o})`),n.click(),i.click();const a=[...await(0,d.waitForSelector)(r.form)][0];if(!a)return(0,l.handleMatchFailure)(r.form,null);t=a.cloneNode(!0);const c=a.querySelector(e.close);return c.click(),t})(e);if(!e)return(0,l.handleMatchFailure)(t.form,null);const r=(0,d.arraySelect)(e,t.votes.labels),s={vandalism:0,improvement:0,intent:0,reply:0,harm:0,guidance:0,copyright:0,circular:0},o={102:"improvement",101:"vandalism",104:"intent",105:"reply",106:"copyright",107:"guidance",110:"circular",0:"harm"},n=t.votes.counts;return r.forEach(e=>{const t=e["htmlFor"];var[,r]=t.match(/(\d+$)/)||[],r=o[r];e.querySelector(n)&&(s[r]+=1)}),s}},{"./domUtils":8,"./utils":19}],14:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.reportHandlersStatus=void 0;r.reportHandlersStatus=(e,s,t)=>{t=t.reduce((e,t,r)=>`${e}
${s[r]} - `+(t?"success":"failure"),`[${e}] handler run:`);console.debug(t)}},{}],15:[function(e,t,c){"use strict";Object.defineProperty(c,"__esModule",{value:!0}),c.addStatsSidebar=c.createRejectionCountItem=c.createEditorStatsItem=c.createEditAuthorItem=void 0;const d=e("./api"),g=e("./dom"),p=e("./getters"),l=e("./rejections"),f=e("./templaters"),u=e("./users"),m=e("./utils");c.createEditAuthorItem=({display_name:e,reputation:t,link:r})=>{const s=(0,f.p)("Name: ");return s.append((0,f.a)(r,e)),(0,g.createItem)((0,f.ul)({header:"Edit Author",items:[s,"Reputation: "+t]}))},c.createEditorStatsItem=({link:e},t)=>{const{approved:r,pending:s,rejected:o,total:n,ratio:{approvedToRejected:i,ofApproved:a,ofPending:c,ofRejected:d}}=(0,p.getSuggestionTotals)(t),l={header:"Author Stats",items:[]};if(n)return l.items.push(`Approved: ${r} (${(0,m.toPercent)(a,2)})`,`Rejected: ${o} (${(0,m.toPercent)(d,2)})`,`Pending: ${s} (${(0,m.toPercent)(c,2)})`,"Of total: "+n,"Ratio: "+i.toFixed(1)),(0,g.createItem)((0,f.ul)(l));{const u=(0,f.p)("Tag wiki/excerpt edits are not returned.");return u.append((0,f.br)(),(0,f.text)("See their "),(0,f.a)(e+"?tab=activity&sort=suggestions","activity tab")),l.items.push(u),(0,g.createItem)((0,f.ul)(l))}},c.createRejectionCountItem=e=>{const t=Object.entries(e).filter(([,e])=>!!e),r=t.map(([e,t])=>(0,m.scase)(e)+": "+t);return r.length||r.push("No reject votes"),(0,g.createItem)((0,f.ul)({items:r,header:"Reject votes"}))};c.addStatsSidebar=async e=>{const t=document.querySelector(e.selectors.actions.sidebar);if(!t)return!1;const r=document.createElement("div"),s=(r.classList.add("s-sidebarwidget","ps-sticky","t64","ml24","mt24","ws3"),r.id=e.ids.sidebar.extra+"-"+(0,m.getReviewId)(),document.createElement("div")),o=(s.classList.add("s-sidebarwidget--header"),s.textContent="Extra Info",document.createElement("div"));o.classList.add(e.classes.grid.container,"fd-column");var n=(0,p.getEditAuthorId)(),i=await(0,l.getRejectionCount)(e);if(!i)return!1;const a=[];return n&&([e,n]=await Promise.all([(0,u.getUserInfo)(e,n),(0,d.getSuggestionsUserStats)(e,n)]),e&&a.push((0,c.createEditAuthorItem)(e),(0,c.createEditorStatsItem)(e,n))),a.push((0,c.createRejectionCountItem)(i)),o.append(...a),r.append(s,o),t.append(r),!0}},{"./api":2,"./dom":7,"./getters":9,"./rejections":13,"./templaters":16,"./users":18,"./utils":19}],16:[function(e,t,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.ul=n.text=n.p=n.li=n.br=n.a=void 0;n.a=(e,t=e)=>{const r=document.createElement("a");return r.href=e,r.textContent=t,r.target="_blank",r.referrerPolicy="no-referrer",r},n.br=()=>document.createElement("br"),n.li=e=>{const t=document.createElement("li");return"string"==typeof e?t.textContent=e:t.append(e),t},n.p=e=>{const t=document.createElement("p");return t.style.marginBottom="0",t.innerText=e,t},n.text=e=>document.createTextNode(e);n.ul=({header:e,items:t})=>{const r=document.createElement("ul"),s=r["style"];if(s.listStyle="none",s.margin="0",e){const o=document.createElement("h3");o.classList.add("mb8"),o.textContent=e,r.append(o)}e=t.map(n.li);return r.append(...e),r}},{}],17:[function(e,t,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.optimizePageTitle=n.removeTitleLines=void 0;const i=e("./dom"),a=e("./utils");n.removeTitleLines=(e,t)=>(t||document).querySelectorAll(e.selectors.title.description).forEach(e=>e.remove());n.optimizePageTitle=e=>{var t=e.selectors.title.title;const r=document.querySelector(t);if(!r)return(0,a.handleMatchFailure)(t,!1);r.classList.add(e.classes.grid.container);t=document.querySelector(e.selectors.title.header);const s=(0,i.createGridCell)(e);s.classList.add("ml12"),t&&s.append(t);t=r.querySelector(e.selectors.title.learnMore);const o=s.cloneNode();return t&&o.append(t),(0,n.removeTitleLines)(e,r),r.append(s,o),!0}},{"./dom":7,"./utils":19}],18:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.getUserInfo=void 0;const n=e("./config");r.getUserInfo=async({filters:{unsafe:e}},t,r=n.DEF_SITE)=>{const s=new URL(`${n.API_BASE}/${n.API_VER}/users/`+t),o=(s.search=new URLSearchParams({site:r,filter:e}).toString(),await fetch(s.toString()));if(!o.ok)return null;var[t]=(await o.json())["items"];return t}},{"./config":5}],19:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.getReviewId=r.trimNumericString=r.toPercent=r.toApiDate=r.scase=r.safeMatch=r.last=r.handleMatchFailure=void 0;r.handleMatchFailure=(e,t)=>(console.debug("Couldn't find the element with selector: "+e),t),r.last=e=>e[e.length-1],r.safeMatch=(e,t,r="")=>(e.match(t)||[e,r]).slice(1),r.scase=e=>e[0].toUpperCase()+e.slice(1).toLowerCase(),r.toApiDate=e=>(e.valueOf()/1e3).toString(),r.toPercent=(e,t=0)=>{const r=100*e;return r.toFixed(r!==Math.trunc(r)?t:0)+"%"},r.trimNumericString=e=>e.replace(/\D/g,"");r.getReviewId=()=>(0,r.last)(location.href.split("/"))},{}]},{},[11]);