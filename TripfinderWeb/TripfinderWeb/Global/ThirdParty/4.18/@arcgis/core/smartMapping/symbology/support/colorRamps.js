/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import"../../../chunks/object.js";import"../../../core/lang.js";import"../../../config.js";import"../../../chunks/Logger.js";import"../../../chunks/string.js";import"../../../chunks/ensureType.js";import"../../../chunks/mathUtils2.js";import"../../../chunks/colorUtils.js";import n from"../../../Color.js";import{c as s}from"../../../chunks/colors2.js";function o(s){const o=[];for(const t in s){const r=Number(t);if(!isNaN(r)){const c=s[t];o.push({colors:c.map((s=>new n(s))),numClasses:r})}}return{name:s.name,tags:[...s.tags],colors:s.stops.map((s=>new n(s))),colorsForClassBreaks:o}}function t(n){return Array.isArray(n[2]&&n[2][0])}function r(){const n=[];for(const r in s){const c=s[r];t(c)||n.push(o(c))}return n}function c(){const n=[];for(const o in s){const r=s[o];t(r)||n.push(r.name)}return n}function e(n){let r=null;for(const c in s){const e=s[c];if(!t(e)&&e.name===n){r=o(e);break}}return r}function i(n){const{includedTags:r,excludedTags:c}=n;if(!r&&!c)return[];const e=!(r&&r.length),i=!(c&&c.length),u=[];for(const n in s){const a=s[n];if(!t(a)){const n=!!e||r.every((n=>a.tags.indexOf(n)>-1)),s=!i&&c.every((n=>a.tags.indexOf(n)>-1));n&&!s&&u.push(o(a))}}return u}export{r as all,e as byName,i as byTag,c as names};
