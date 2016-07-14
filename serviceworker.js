!function(){"use strict";function updateStaticCache(){return caches.open(staticCacheName).then((cache=>{return cache.addAll([baseurl+"/",baseurl+"/about",baseurl+"/articles",baseurl+"/links",baseurl+"/pens",baseurl+"/search",baseurl+"/styleguide",baseurl+"/tags",baseurl+"/offline",baseurl+"/css/main.min.css",baseurl+"/js/main.min.js",baseurl+"/images/avatar.png",baseurl+"/favicon.png",baseurl+"/search.json"])}))}function clearOldCaches(){return caches.keys().then((keys=>{return Promise.all(keys.filter((key=>{return 0!==key.indexOf(version)})).map((key=>{return caches["delete"](key)})))}))}const version="201607142",baseurl="https://chrisburnell.com",staticCacheName="static"+version;self.addEventListener("install",(event=>{event.waitUntil(updateStaticCache().then((()=>self.skipWaiting())))})),self.addEventListener("activate",(event=>{event.waitUntil(clearOldCaches().then((()=>self.clients.claim())))})),self.addEventListener("fetch",(event=>{let request=event.request,url=new URL(request.url);return url.origin===location.origin?"GET"!==request.method?void event.respondWith(fetch(request)["catch"]((()=>{return caches.match(baseurl+"/offline")}))):-1!==request.headers.get("Accept").indexOf("text/html")?(request=new Request(request.url,{method:"GET",headers:request.headers,mode:"navigate"==request.mode?"cors":request.mode,credentials:request.credentials,redirect:request.redirect}),void event.respondWith(fetch(request).then((response=>{return response}))["catch"](function(){return caches.match(request).then((response=>{return response||caches.match("/offline")}))}))):void event.respondWith(caches.match(request).then((response=>{return response||fetch(request)}))):void 0}))}();