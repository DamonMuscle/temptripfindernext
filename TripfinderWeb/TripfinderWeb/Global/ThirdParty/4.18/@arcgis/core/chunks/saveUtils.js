/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import{eachAlways as r,throwIfAborted as e}from"../core/promiseUtils.js";import o from"../core/Error.js";import{r as t}from"./asyncUtils.js";import{g as s}from"./resourceExtension.js";import{getSiblingOfSameTypeI as c}from"./resourceUtils.js";async function a(t,a,h){if(!a||!a.resources)return;const u=a.portalItem===t.portalItem?new Set(t.paths):new Set;t.paths.length=0,t.portalItem=a.portalItem;const i=new Set(a.resources.toKeep.map((r=>r.resource.path))),f=new Set,m=[];i.forEach((r=>{u.delete(r),t.paths.push(r)}));for(const r of a.resources.toUpdate)if(u.delete(r.resource.path),i.has(r.resource.path)||f.has(r.resource.path)){const{resource:e,content:o,finish:a,error:p}=r,u=c(e,s());t.paths.push(u.path),m.push(n({resource:u,content:o,finish:a,error:p},h))}else t.paths.push(r.resource.path),m.push(p(r,h)),f.add(r.resource.path);for(const r of a.resources.toAdd)m.push(n(r,h)),t.paths.push(r.resource.path);if(u.forEach((r=>{const e=a.portalItem.resourceFromPath(r);m.push(e.portalItem.removeResource(e).catch((()=>{})))})),0===m.length)return;const l=await r(m);e(h);const d=l.filter((r=>"error"in r)).map((r=>r.error));if(d.length>0)throw new o("save:resources","Failed to save one or more resources",{errors:d})}async function n(r,e){const o=await t(r.resource.portalItem.addResource(r.resource,r.content,e));if(!0!==o.ok)throw r.error&&r.error(o.error),o.error;r.finish&&r.finish(r.resource)}async function p(r,e){const o=await t(r.resource.update(r.content,e));if(!0!==o.ok)throw r.error(o.error),o.error;r.finish(r.resource)}export{a as s};
